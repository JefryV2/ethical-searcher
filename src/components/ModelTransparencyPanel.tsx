
// The ML panel of the entity detail page.
//
// Runs the on-device transparency engine (MobileBERT-MNLI entailment) the
// first time the tab is opened, and renders every dimension with its
// provenance: which fields supplied the evidence, and whether the dimension
// could be scored at all. Dimensions without evidence are shown as unscored,
// never estimated — the same philosophy as the catalog's "needs data" rows.

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, CircleSlash, Info } from 'lucide-react';
import type { EntityData } from '@/types/entityTypes';
import { analyzeTransparency, type TransparencyAnalysis } from '@/services/transparencyEngine';
import { ModelStatus } from '@/components/ModelStatus';

interface ModelTransparencyPanelProps {
  entity: EntityData;
}

const scoreTone = (score: number) => {
  if (score >= 70) return { text: 'score-good', bar: 'bg-score-good' };
  if (score >= 40) return { text: 'score-mid', bar: 'bg-score-mid' };
  return { text: 'score-low', bar: 'bg-score-low' };
};

const ScoreStat = ({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: number | null;
  hint?: string;
  muted?: boolean;
}) => (
  <div className="border border-border rounded-md p-3 min-w-[110px]">
    <p className="ds-text-label-sm text-muted-foreground">{label}</p>
    <p className={`ds-text-title-lg score-num ${muted ? 'text-muted-foreground' : ''}`}>
      {value === null ? '—' : value}
      <span className="ds-text-body-sm text-muted-foreground font-normal">/100</span>
    </p>
    {hint && <p className="ds-text-label-sm text-muted-foreground normal-case">{hint}</p>}
  </div>
);

export const ModelTransparencyPanel = ({ entity }: ModelTransparencyPanelProps) => {
  const [analysis, setAnalysis] = useState<TransparencyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRunning(true);
    setError(null);
    setAnalysis(null);

    analyzeTransparency(entity)
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .catch((err) => {
        console.error('Transparency engine failed:', err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `The on-device model could not run: ${err.message}`
              : 'The on-device model could not run in this browser.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entity]);

  if (running) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-start gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="ds-text-body-sm font-medium text-foreground">Running the on-device model…</p>
            <p className="ds-text-body-sm mt-1">
              MobileBERT entailment on this entity's record. The model (~26 MB) downloads once
              per browser, then runs locally — no key, no server.
            </p>
            <div className="mt-2">
              <ModelStatus />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="glass-card p-6 space-y-2">
        <p className="ds-text-body-sm score-mid flex items-start gap-2">
          <CircleSlash className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error ?? 'The model analysis returned nothing for this entity.'}</span>
        </p>
        <p className="ds-text-body-sm text-muted-foreground">
          The deterministic evidence-coverage score still stands on its own — it never depends
          on this model.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Brain className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h2 className="ds-text-title-sm">Model transparency analysis</h2>
              <p className="ds-text-body-sm text-muted-foreground">
                {analysis.provenance[1]}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScoreStat
              label="Model"
              value={analysis.modelScore}
              hint={analysis.modelScore === null ? 'not scoreable' : 'entailment'}
            />
            <ScoreStat
              label="Combined"
              value={analysis.blendedScore}
              hint={analysis.modelScore !== null ? '50 / 50 display' : 'catalog only'}
            />
            <ScoreStat label="Catalog" value={analysis.baselineScore} hint="evidence coverage" muted />
          </div>
        </div>

        <div className="space-y-5">
          {analysis.dimensions.map((dim) => {
            const tone = dim.score === null ? null : scoreTone(dim.score);
            return (
              <div key={dim.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="ds-text-body-sm font-medium">{dim.label}</span>
                    <Badge
                      variant="outline"
                      className={
                        dim.provenance === 'on-device model'
                          ? 'text-primary border-primary/40 font-normal'
                          : 'text-muted-foreground border-muted-foreground/30 font-normal'
                      }
                    >
                      {dim.provenance}
                    </Badge>
                  </div>
                  <span
                    className={`ds-text-numeric-md ${tone ? tone.text : 'text-muted-foreground'}`}
                  >
                    {dim.score === null ? 'unscored' : `${dim.score}/100`}
                  </span>
                </div>
                {dim.score !== null && tone && (
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${tone.bar} transition-all duration-500`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                )}
                <p className="ds-text-body-sm text-muted-foreground">
                  {dim.detail}{' '}
                  <span className="text-muted-foreground/80">
                    Evidence: {dim.evidenceFrom.length ? dim.evidenceFrom.join(', ') : 'none on record'}.
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-start gap-2 ds-text-body-sm text-muted-foreground px-1">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          What this is not: the scores are entailment readings of web-published evidence attached to
          this record, not independent fact-checks. Dimensions without evidence on record are
          reported as unscored instead of being estimated.
        </p>
      </div>
    </div>
  );
};
