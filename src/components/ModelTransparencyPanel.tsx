// The ML panel of the entity detail page.
//
// Runs the on-device transparency engine (MobileBERT-MNLI entailment) the
// first time the tab is opened, and renders every dimension with its
// provenance: which fields supplied the evidence, and whether the dimension
// could be scored at all.

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
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
  <div className="border border-border p-3 min-w-[110px] font-mono bg-card">
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    <p className={`text-xl font-bold font-mono ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
      {value === null ? '—' : value}
      <span className="text-xs text-muted-foreground font-normal ml-0.5">/100</span>
    </p>
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
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
      <Card className="dossier-card p-6 font-mono">
        <div className="space-y-2 text-muted-foreground">
          <p className="text-xs font-bold text-primary animate-pulse">&gt; RUNNING ON-DEVICE MODEL INFERENCE...</p>
          <p className="text-xs leading-relaxed">
            MobileBERT entailment analyzing public evidence (~26MB ONNX runtime in browser sandbox).
          </p>
          <div className="pt-2">
            <ModelStatus />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="dossier-card p-6 space-y-2 font-mono">
        <p className="text-xs text-destructive font-bold">
          [!] {error ?? 'The model analysis returned nothing for this entity.'}
        </p>
        <p className="text-xs text-muted-foreground">
          The deterministic evidence-coverage score remains unaffected.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-mono">
      <Card className="dossier-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
              <h2 className="text-sm font-bold text-foreground">MODEL TRANSPARENCY AUDIT</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.provenance[1]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScoreStat
              label="Model"
              value={analysis.modelScore}
              hint={analysis.modelScore === null ? 'unscored' : 'entailment'}
            />
            <ScoreStat
              label="Combined"
              value={analysis.blendedScore}
              hint={analysis.modelScore !== null ? '50/50 blend' : 'catalog only'}
            />
            <ScoreStat label="Catalog" value={analysis.baselineScore} hint="coverage" muted />
          </div>
        </div>

        <div className="space-y-4">
          {analysis.dimensions.map((dim) => {
            const tone = dim.score === null ? null : scoreTone(dim.score);
            return (
              <div key={dim.id} className="space-y-1.5 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-bold text-foreground">{dim.label}</span>
                    <span
                      className={`text-[10px] border px-1.5 py-0.5 ${
                        dim.provenance === 'on-device model'
                          ? 'text-primary border-primary/40'
                          : 'text-muted-foreground border-border'
                      }`}
                    >
                      [{dim.provenance}]
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold ${tone ? tone.text : 'text-muted-foreground'}`}
                  >
                    {dim.score === null ? '[UNSCORED]' : `${dim.score}/100`}
                  </span>
                </div>
                {dim.score !== null && tone && (
                  <div className="h-1 w-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${tone.bar}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {dim.detail}{' '}
                  <span className="text-muted-foreground/70">
                    [Evidence: {dim.evidenceFrom.length ? dim.evidenceFrom.join(', ') : 'none'}]
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="text-xs text-muted-foreground px-1 border-l-2 border-border/80 pl-2">
        <p>
          * Scores are semantic entailment readings of attached public web evidence, not editorial fact checks.
          Dimensions lacking verified source evidence are left unscored.
        </p>
      </div>
    </div>
  );
};
