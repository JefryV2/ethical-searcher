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

interface ModelTransparencyPanelProps {
  entity: EntityData;
}

const scoreColor = (score: number) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

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
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Running the on-device model…</p>
            <p className="text-xs mt-1">
              MobileBERT entailment on this entity's record. The model (~26 MB) downloads once
              per browser, then runs locally — no key, no server.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="glass-card p-6">
        <p className="text-sm text-amber-600 flex items-start gap-2">
          <CircleSlash className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error ?? 'The model analysis returned nothing for this entity.'}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          The catalog's deterministic score below still stands on its own — it never depends
          on this model.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Model transparency analysis</p>
              <p className="text-xs text-muted-foreground">
                {analysis.provenance[1]} applied to this entity's recorded evidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {analysis.modelScore !== null && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Model score</p>
                <p className="text-lg font-medium">{analysis.modelScore}/100</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Combined</p>
              <p className="text-lg font-medium">{analysis.blendedScore}/100</p>
              <p className="text-[10px] text-muted-foreground">
                {analysis.modelScore !== null
                  ? 'catalog score · 50% + model · 50%'
                  : 'catalog score only'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Catalog</p>
              <p className="text-lg font-medium text-muted-foreground">{analysis.baselineScore}/100</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {analysis.dimensions.map((dim) => (
            <div key={dim.id} className="space-y-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{dim.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      dim.provenance === 'on-device model'
                        ? 'text-primary border-primary/40'
                        : 'text-muted-foreground border-muted-foreground/30'
                    }
                  >
                    {dim.provenance}
                  </Badge>
                </div>
                <span className="text-sm font-mono">
                  {dim.score === null ? 'unscored' : `${dim.score}/100`}
                </span>
              </div>
              {dim.score !== null && (
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${scoreColor(dim.score)} transition-all duration-500`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {dim.detail} Evidence: {dim.evidenceFrom.length ? dim.evidenceFrom.join(', ') : 'none on record'}.
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          What this is not: the scores are entailment readings of web-published evidence attached to
          this catalog record, not independent fact-checks. Dimensions without evidence on record are
          reported as unscored instead of being estimated.
        </p>
      </div>
    </div>
  );
};
