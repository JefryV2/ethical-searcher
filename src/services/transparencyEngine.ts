// The transparency engine: pairs the deterministic catalog score with a
// genuine on-device NLI analysis.
//
// For each transparency dimension we take the entity's evidence text and ask
// two entailment questions of the MobileBERT MNLI model:
//   - "This entity IS transparent about <dimension>"
//   - "This entity EVADES disclosure about <dimension>"
// The dimension score is the normalized entailment share of the positive
// statement. When a dimension has no evidence text at all we refuse to score
// it — a missing disclosure is reported, never estimated.

import type { EntityData } from '@/types/entityTypes';
import { getZeroShotClassifier } from './mlService';

export interface DimensionResult {
  id: string;
  label: string;
  /** 0-100 model score, or null when the data cannot support this dimension. */
  score: number | null;
  provenance: 'on-device model' | 'insufficient evidence';
  /** Which entity fields supplied the evidence for this dimension. */
  evidenceFrom: string[];
  detail: string;
}

export interface TransparencyAnalysis {
  /** The catalog's own score, kept as the deterministic baseline. */
  baselineScore: number;
  /** Mean of the dimensions the model could actually evidence. */
  modelScore: number | null;
  /** 50/50 blend of baseline and model when both exist, else the one that does. */
  blendedScore: number;
  dimensions: DimensionResult[];
  provenance: string[];
}

interface Dimension {
  id: string;
  label: string;
  positiveHypothesis: string;
  negativeHypothesis: string;
  /** Entity fields that legitimately count as evidence for this dimension. */
  evidenceFields: (keyof EntityData)[];
  /** Minimum evidence characters required before we attempt a model score. */
  minEvidenceChars: number;
}

const DIMENSIONS: Dimension[] = [
  {
    id: 'sponsored_disclosure',
    label: 'Sponsored content disclosure',
    positiveHypothesis:
      'This entity clearly discloses its paid partnerships, sponsorships and advertising relationships.',
    negativeHypothesis:
      'This entity hides or evades disclosure of its paid partnerships, sponsorships and advertising relationships.',
    evidenceFields: ['disclosures', 'sponsorships', 'description', 'ethical_analysis'],
    minEvidenceChars: 120,
  },
  {
    id: 'claim_sourcing',
    label: 'Evidence behind claims',
    positiveHypothesis:
      'The statements this entity makes are backed by verifiable evidence and cited sources.',
    negativeHypothesis:
      'The statements this entity makes are unsupported by any cited evidence or sources.',
    evidenceFields: ['description', 'ethical_analysis', 'controversies'],
    minEvidenceChars: 60,
  },
  {
    id: 'operational_transparency',
    label: 'Operational transparency',
    positiveHypothesis:
      'This entity publishes how it operates, how decisions are made, and how it performs.',
    negativeHypothesis:
      'This entity keeps its operations, decision making and performance hidden from the public.',
    evidenceFields: ['description', 'ethical_analysis', 'certifications'],
    minEvidenceChars: 60,
  },
  {
    id: 'controversy_response',
    label: 'Controversy response',
    positiveHypothesis:
      'When controversies arose, this entity addressed them openly and took corrective action.',
    negativeHypothesis:
      'When controversies arose, this entity responded to them with denial and cover-up.',
    evidenceFields: ['controversies'],
    minEvidenceChars: 40,
  },
  {
    id: 'conflict_of_interest',
    label: 'Conflict-of-interest disclosure',
    positiveHypothesis:
      'This entity discloses its funding sources and potential conflicts of interest clearly.',
    negativeHypothesis:
      'This entity conceals funding sources that would reveal conflicts of interest.',
    evidenceFields: ['disclosures', 'sponsorships', 'ethical_analysis'],
    minEvidenceChars: 60,
  },
];

/** Collect the raw evidence text for a dimension and remember where it came from. */
const collectEvidence = (entity: EntityData, fields: (keyof EntityData)[]) => {
  const chunks: string[] = [];
  const held: string[] = [];
  for (const field of fields) {
    const value = entity[field];
    if (!value) continue;
    let text = '';
    if (field === 'controversies' && Array.isArray(value)) {
      text = value.map((c) => `${c.title} ${c.description}`).join(' ');
    } else if (field === 'disclosures' && Array.isArray(value)) {
      text = value.map((d) => `${d.title} ${d.description}`).join(' ');
    } else if (field === 'sponsorships' && Array.isArray(value)) {
      text = value.map((s) => `${s.company} ${s.details}`).join(' ');
    } else if (field === 'certifications' && Array.isArray(value)) {
      text = value.join(' ');
    } else if (typeof value === 'string') {
      text = value;
    }
    if (text.trim()) {
      chunks.push(text);
      held.push(field as string);
    }
  }
  return { evidence: chunks.join(' '), evidenceFrom: held };
};

const FIELD_LABELS: Record<string, string> = {
  disclosures: 'published disclosures',
  sponsorships: 'sponsorship history',
  description: 'catalog description',
  ethical_analysis: 'recorded analysis',
  controversies: 'reported controversies',
  certifications: 'certifications',
};

const prettifyFields = (fields: string[]) =>
  fields.map((f) => FIELD_LABELS[f] ?? f).join(', ');

const MODELS_NLI_SHORT = 'MobileBERT-MNLI';

/** Run the on-device NLI analysis. Throws if the model fails to load. */
export const analyzeTransparency = async (entity: EntityData): Promise<TransparencyAnalysis> => {
  const classify = await getZeroShotClassifier();

  const baselineScore =
    entity.ethicalScore > 10 ? entity.ethicalScore : Math.round(entity.ethicalScore * 10);

  const dimensions: DimensionResult[] = [];
  // BERT context is 512 tokens; feed a focused premise per dimension instead
  // of the whole scraped record.
  const PREMISE_LIMIT = 2200;
  for (const dim of DIMENSIONS) {
    const { evidence: rawEvidence, evidenceFrom } = collectEvidence(entity, dim.evidenceFields);
    const evidence = rawEvidence.length > PREMISE_LIMIT ? rawEvidence.slice(0, PREMISE_LIMIT) : rawEvidence;
    if (evidence.trim().length < dim.minEvidenceChars) {
      dimensions.push({
        id: dim.id,
        label: dim.label,
        score: null,
        provenance: 'insufficient evidence',
        evidenceFrom: evidenceFrom,
        detail: `No evidence on record for ${prettifyFields(dim.evidenceFields)} — this dimension is reported as unscored, not estimated.`,
      });
      continue;
    }

    const result = await classify(evidence, [dim.positiveHypothesis, dim.negativeHypothesis], {
      hypothesisTemplate: '{label}',
    });

    const positive = result.labels.indexOf(dim.positiveHypothesis);
    const negative = result.labels.indexOf(dim.negativeHypothesis);
    const positiveScore = positive >= 0 ? result.scores[positive] : 0;
    const negativeScore = negative >= 0 ? result.scores[negative] : 0;
    const total = positiveScore + negativeScore;

    const score = total > 0 ? Math.round((positiveScore / total) * 100) : null;
    if (score === null) {
      dimensions.push({
        id: dim.id,
        label: dim.label,
        score: null,
        provenance: 'insufficient evidence',
        evidenceFrom,
        detail: 'The model could not separate the hypotheses on this evidence.',
      });
      continue;
    }
    dimensions.push({
      id: dim.id,
      label: dim.label,
      score,
      provenance: 'on-device model',
      evidenceFrom,
      detail:
        score >= 60
          ? `Entailment favours the transparent reading (${positiveScore.toFixed(2)} vs ${negativeScore.toFixed(2)}).`
          : `Entailment favours the evasive reading (${negativeScore.toFixed(2)} vs ${positiveScore.toFixed(2)}).`,
    });
  }

  const scored = dimensions.filter((d): d is DimensionResult & { score: number } => d.score !== null);
  const modelScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, d) => sum + d.score, 0) / scored.length)
      : null;

  const blendedScore =
    modelScore !== null ? Math.round(baselineScore * 0.5 + modelScore * 0.5) : baselineScore;

  return {
    baselineScore,
    modelScore,
    blendedScore,
    dimensions,
    provenance: [
      'deterministic score (catalog for samples, evidence coverage for live records)',
      `${MODELS_NLI_SHORT} zero-shot entailment (on-device) applied to scraped evidence`,
    ],
  };
};
