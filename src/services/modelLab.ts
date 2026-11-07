// A small, reproducible evaluation for the on-device models — and a
// rule-vs-model comparison on real record passages.
//
// The probe set is hand-labeled and deliberately tiny: it is a sanity check,
// not a benchmark. Every number shown in the UI is computed live in the
// browser from these fixtures, so the label "measured here" is literally true.

import { cosineSimilarity, embedText, embedTexts, getZeroShotClassifier } from './mlService';
import { classifySignalKinds, type SignalKind } from './scrapeService';
import type { EvidencePassage } from './passages';

export interface EmbeddingProbe {
  query: string;
  passages: string[];
  /** Index of the passage that should rank first. */
  expected: number;
}

export const EMBEDDING_PROBES: EmbeddingProbe[] = [
  {
    query: 'factory audits in the supply chain',
    passages: [
      'Independent auditors inspect every tier-one factory twice a year and publish the findings.',
      'Our autumn collection includes waterproof jackets and recycled fleece.',
      'The company reported quarterly earnings of 1.2 billion dollars.',
      'Tickets for the summer festival go on sale next Friday.',
    ],
    expected: 0,
  },
  {
    query: 'how much the CEO is paid',
    passages: [
      'Executive compensation is set by the board and disclosed in the annual proxy statement.',
      'Our stores are open from nine in the morning until eight at night.',
      'The new phone has a larger battery and a brighter screen.',
      'We sponsor a local football club and its youth academy.',
    ],
    expected: 0,
  },
  {
    query: 'labour dispute with warehouse workers',
    passages: [
      'Warehouse staff walked out after negotiations over shift patterns collapsed.',
      'The museum opens a new exhibition of modern sculpture this weekend.',
      'Our recipe uses butter, flour, sugar and a pinch of salt.',
      'The airline added three new routes to its winter schedule.',
    ],
    expected: 0,
  },
  {
    query: 'privacy policy and personal data',
    passages: [
      'The policy explains what personal data is collected, why, and how long it is retained.',
      'This article reviews the best running shoes for long-distance training.',
      'The city council approved the budget for road repairs.',
      'Our team won the championship after a penalty shootout.',
    ],
    expected: 0,
  },
  {
    query: 'charitable donations and community programmes',
    passages: [
      'The foundation donated two million dollars to local food banks and literacy programmes.',
      'The laptop ships with a one-year warranty and a charger.',
      'Ticket prices increased by ten percent this season.',
      'The novel follows three generations of a family in a coastal town.',
    ],
    expected: 0,
  },
];

export interface NliProbe {
  text: string;
  positive: string;
  negative: string;
  expected: 'positive' | 'negative';
}

export const NLI_PROBES: NliProbe[] = [
  {
    text: 'We publish an annual sustainability report audited by an independent third party.',
    positive: 'The text publishes audited impact reports.',
    negative: 'The text hides its operational impact.',
    expected: 'positive',
  },
  {
    text: 'Our advertising disclosure policy explains every paid partnership on this channel.',
    positive: 'The text discloses paid partnerships.',
    negative: 'The text conceals paid partnerships.',
    expected: 'positive',
  },
  {
    text: 'We do not disclose who funds our research or our commercial partnerships.',
    positive: 'The text discloses who funds its research.',
    negative: 'The text conceals who funds its research.',
    expected: 'negative',
  },
  {
    text: 'Every claim in our reviews links to the original study and its methodology.',
    positive: 'The text cites sources for its claims.',
    negative: 'The text makes claims without sources.',
    expected: 'positive',
  },
  {
    text: 'We removed the correction notice and have not addressed the error.',
    positive: 'The text addresses the error and issues a correction.',
    negative: 'The text avoids addressing the error.',
    expected: 'negative',
  },
  {
    text: 'The company refused to answer questions about the factory investigation.',
    positive: 'The company responds openly to the investigation.',
    negative: 'The company refuses to respond to the investigation.',
    expected: 'negative',
  },
  {
    text: 'This page lists all sponsors, affiliate links and gifted products.',
    positive: 'The text discloses sponsorships and affiliate relationships.',
    negative: 'The text hides sponsorships and affiliate relationships.',
    expected: 'positive',
  },
  {
    text: 'Financial support for this project is not publicly listed anywhere.',
    positive: 'The text publicly lists its financial support.',
    negative: 'The text keeps its financial support private.',
    expected: 'negative',
  },
  {
    text: 'We are proud to say we have never published a sustainability report.',
    positive: 'The text publishes a sustainability report.',
    negative: 'The text does not publish a sustainability report.',
    expected: 'negative',
  },
  {
    // Hard on purpose: the funding is mentioned, but the sentence says the
    // arrangement is private. The model reads the first clause and misses the
    // negation — a failure worth showing rather than hiding.
    text: 'Our partners fund the research, but we keep that arrangement private.',
    positive: 'The text discloses who funds the research.',
    negative: 'The text conceals who funds the research.',
    expected: 'negative',
  },
];

export interface RuleProbe {
  text: string;
  expected: SignalKind | 'none';
}

export const RULE_PROBES: RuleProbe[] = [
  { text: 'Our advertising disclosure explains paid partnerships and sponsored content.', expected: 'disclosure' },
  { text: 'This video contains a paid partnership with a skincare brand.', expected: 'disclosure' },
  { text: 'Every claim links to the original study, with a full methodology section.', expected: 'sourcing' },
  { text: 'References and citations are listed at the end of each article.', expected: 'sourcing' },
  { text: 'Read our 2025 annual report and audited sustainability report.', expected: 'operations' },
  { text: 'We publish an annual impact report every year.', expected: 'operations' },
  { text: 'We issued a correction and apologised for the error.', expected: 'controversy_response' },
  { text: 'The company settled the investigation and published a retraction.', expected: 'controversy_response' },
  { text: 'Our conflict of interest policy and funding partners are listed here.', expected: 'conflicts' },
  { text: 'Our new collection features lightweight jackets in six colours.', expected: 'none' },
  // Adversarial probes: the regex layer is literal, so these expose where a
  // keyword hit is not the same thing as the claim being made.
  { text: 'The names of our funders are kept confidential.', expected: 'conflicts' },
  { text: 'Factory inspections happen every year but the results stay internal.', expected: 'operations' },
  { text: 'We never publish an annual report or impact report.', expected: 'none' },
];

export interface LabReport {
  embedding: {
    correct: number;
    total: number;
    avgMargin: number;
    ms: number;
  };
  nli: {
    correct: number;
    total: number;
    matrix: Record<'positive' | 'negative', Record<'positive' | 'negative', number>>;
    ms: number;
  };
  rules: {
    correct: number;
    total: number;
    misses: Array<{ text: string; expected: string; got: string[] }>;
    ms: number;
  };
  ranAt: string;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Runs every probe once. Sequential on purpose: the point is honest latency
 *  per item, not throughput. */
export const runModelLab = async (
  onProgress?: (message: string) => void,
): Promise<LabReport> => {
  // Embedding retrieval probes.
  onProgress?.('Embedding retrieval probes…');
  const embedStart = now();
  let embedCorrect = 0;
  let marginSum = 0;
  for (const probe of EMBEDDING_PROBES) {
    const [queryVector, passageVectors] = await Promise.all([
      embedText(probe.query),
      embedTexts(probe.passages),
    ]);
    const scores = passageVectors
      .map((vector) => cosineSimilarity(queryVector, vector))
      .sort((a, b) => b - a);
    const best = passageVectors
      .map((vector) => cosineSimilarity(queryVector, vector))
      .indexOf(scores[0]);
    if (best === probe.expected) embedCorrect += 1;
    marginSum += (scores[0] ?? 0) - (scores[1] ?? 0);
  }
  const embedMs = now() - embedStart;

  // NLI entailment probes.
  onProgress?.('Running entailment probes…');
  const nliStart = now();
  const classifier = await getZeroShotClassifier();
  const matrix: LabReport['nli']['matrix'] = {
    positive: { positive: 0, negative: 0 },
    negative: { positive: 0, negative: 0 },
  };
  let nliCorrect = 0;
  for (const probe of NLI_PROBES) {
    const result = await classifier(probe.text, [probe.positive, probe.negative], {
      hypothesisTemplate: '{label}',
    });
    const positiveScore = result.scores[result.labels.indexOf(probe.positive)] ?? 0;
    const negativeScore = result.scores[result.labels.indexOf(probe.negative)] ?? 0;
    const predicted: 'positive' | 'negative' = positiveScore >= negativeScore ? 'positive' : 'negative';
    matrix[probe.expected][predicted] += 1;
    if (predicted === probe.expected) nliCorrect += 1;
  }
  const nliMs = now() - nliStart;

  // Rule-layer probes.
  onProgress?.('Checking the regex layer…');
  const ruleStart = now();
  const misses: LabReport['rules']['misses'] = [];
  let ruleCorrect = 0;
  for (const probe of RULE_PROBES) {
    const got = classifySignalKinds(probe.text);
    const hit = probe.expected === 'none' ? got.length === 0 : got.includes(probe.expected);
    if (hit) ruleCorrect += 1;
    else misses.push({ text: probe.text, expected: probe.expected, got });
  }
  const ruleMs = now() - ruleStart;

  return {
    embedding: {
      correct: embedCorrect,
      total: EMBEDDING_PROBES.length,
      avgMargin: marginSum / EMBEDDING_PROBES.length,
      ms: embedMs,
    },
    nli: { correct: nliCorrect, total: NLI_PROBES.length, matrix, ms: nliMs },
    rules: { correct: ruleCorrect, total: RULE_PROBES.length, misses, ms: ruleMs },
    ranAt: new Date().toISOString(),
  };
};

// ---------------------------------------------------------------------------
// Rule vs model on this record
// ---------------------------------------------------------------------------

/** Short noun-phrase topics. Full-sentence hypotheses make MobileBERT
 *  over-predict entailment on almost any text; short topic labels keep the
 *  six-way choice meaningful. */
const AGREEMENT_TOPICS: Array<{ kind: SignalKind; label: string }> = [
  { kind: 'disclosure', label: 'sponsorships and paid partnerships' },
  { kind: 'sourcing', label: 'sources and methodology' },
  { kind: 'operations', label: 'reports and operational information' },
  { kind: 'controversy_response', label: 'issues and corrections' },
  { kind: 'conflicts', label: 'funding and conflicts of interest' },
];

const AGREEMENT_NONE = 'none of these topics';

/** Below this top-label score the model has no usable verdict, so the row is
 *  reported as "none" rather than guessing. */
const MODEL_DECISION_THRESHOLD = 0.45;

export interface AgreementRow {
  text: string;
  url: string;
  ruleKinds: Array<SignalKind>;
  modelKind: SignalKind | 'none';
  modelScore: number;
  agree: boolean;
}

export interface AgreementReport {
  rows: AgreementRow[];
  agreed: number;
  total: number;
  ms: number;
}

const agreementCache = new Map<string, { signature: string; report: AgreementReport }>();

const passageSignature = (entityId: string, passages: EvidencePassage[]): string =>
  `${entityId}:${passages.map((p) => p.id).join(',')}`;

/** Pick a readable spread of passages: detected signals first, then page text,
 *  at most one per URL. */
const selectPassages = (passages: EvidencePassage[], limit: number): EvidencePassage[] => {
  const ordered = [...passages].sort((a, b) => {
    const weight = (p: EvidencePassage) => (p.kind === 'signal' ? 0 : p.kind === 'section' ? 1 : 2);
    return weight(a) - weight(b);
  });
  const seenUrls = new Set<string>();
  const picked: EvidencePassage[] = [];
  for (const passage of ordered) {
    if (seenUrls.has(passage.url)) continue;
    if (passage.text.length < 120) continue;
    seenUrls.add(passage.url);
    picked.push(passage);
    if (picked.length >= limit) break;
  }
  return picked;
};

export const compareRulesAndModel = async (
  entityId: string,
  passages: EvidencePassage[],
  limit = 6,
): Promise<AgreementReport | null> => {
  const selected = selectPassages(passages, limit);
  if (selected.length === 0) return null;

  const signature = passageSignature(entityId, selected);
  const cached = agreementCache.get(entityId);
  if (cached?.signature === signature) return cached.report;

  const classifier = await getZeroShotClassifier();
  const labels = [...AGREEMENT_TOPICS.map((topic) => topic.label), AGREEMENT_NONE];
  const start = now();
  const rows: AgreementRow[] = [];

  for (const passage of selected) {
    const ruleKinds = classifySignalKinds(passage.text);
    const result = await classifier(passage.text.slice(0, 900), labels, {
      hypothesisTemplate: 'This text is about {label}.',
    });
    const topLabel = result.labels[0] ?? AGREEMENT_NONE;
    const topScore = result.scores[0] ?? 0;
    const topKind = AGREEMENT_TOPICS.find((topic) => topic.label === topLabel)?.kind;
    const modelKind: SignalKind | 'none' =
      topScore >= MODEL_DECISION_THRESHOLD && topKind ? topKind : 'none';
    const agree =
      modelKind === 'none' ? ruleKinds.length === 0 : ruleKinds.includes(modelKind);
    rows.push({
      text: passage.text,
      url: passage.url,
      ruleKinds,
      modelKind,
      modelScore: topScore,
      agree,
    });
  }

  const report: AgreementReport = {
    rows,
    agreed: rows.filter((row) => row.agree).length,
    total: rows.length,
    ms: now() - start,
  };
  agreementCache.set(entityId, { signature, report });
  return report;
};
