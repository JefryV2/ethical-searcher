// Sources list with an on-demand independence check.
//
// The count of sources is only honest if duplicates are visible. MiniLM
// clusters near-identical texts, and the list marks anything that repeats an
// earlier source instead of silently counting it twice.

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { SourceRef } from '@/types/entityTypes';
import type { EvidencePassage } from '@/services/passages';
import { analyzeSourceIndependence, type IndependenceResult } from '@/services/sourceIndependence';
import { isEmbedderReady } from '@/services/mlService';
import { timeAgo } from '@/services/report';

interface SourcesSectionProps {
  entityId: string;
  sources: SourceRef[];
  passages: EvidencePassage[];
}

const PROVIDER_LABEL: Record<string, string> = {
  wikidata: 'Wikidata',
  wikipedia: 'Wikipedia',
  website: 'Official site',
  platform: 'Platform',
};

export const SourcesSection = ({ entityId, sources, passages }: SourcesSectionProps) => {
  const [result, setResult] = useState<IndependenceResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setRunning(true);
    setError(null);
    try {
      setResult(await analyzeSourceIndependence(entityId, sources, passages));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Independence check failed: ${err.message}`
          : 'Independence check failed in this browser.',
      );
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (sources.length >= 3 && isEmbedderReady()) void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  return (
    <Card className="dossier-card p-5 space-y-3 font-mono">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
        <h2 className="text-sm font-bold text-foreground">SOURCES</h2>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {sources.length} indexed
        </span>
      </div>

      {result && (
        <div className="flex flex-wrap items-center gap-2 text-xs border-l-2 border-primary/50 pl-2 py-1 bg-secondary/30">
          <span className="font-bold text-primary">
            [{result.independent}/{result.total}] independent
          </span>
          {result.independent < result.total && (
            <span className="text-muted-foreground">
              ({result.total - result.independent} duplicate{result.total - result.independent > 1 ? 's' : ''} flagged)
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            cosine ≥ {result.threshold.toFixed(2)} · MiniLM
          </span>
        </div>
      )}

      {!result && sources.length >= 3 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void check()}
            disabled={running}
            className="btn-terminal px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            {running ? '[COMPUTING...]' : '[CHECK INDEPENDENCE]'}
          </button>
          <span className="text-[10px] text-muted-foreground">
            Runs local 23MB embedding model in-browser.
          </span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <ul className="divide-y divide-border/60 -mx-1 pt-1">
        {sources.map((source, index) => {
          const duplicateOf = result?.duplicateOf[index];
          const representative = duplicateOf !== undefined ? sources[duplicateOf] : undefined;
          return (
            <li key={`${source.provider}-${source.url}`} className="py-2.5 px-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] border border-border px-1.5 py-0.5 text-primary/80 bg-secondary/40">
                  {PROVIDER_LABEL[source.provider] ?? source.provider}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-foreground hover:text-primary inline-flex items-center gap-1 min-w-0"
                >
                  <span className="truncate">{source.title}</span>
                  <span className="text-primary text-[10px]">↗</span>
                </a>
                {representative && (
                  <span
                    className="text-[10px] border border-destructive/40 text-destructive px-1"
                    title={`Near-duplicate of ${representative.title}`}
                  >
                    [DUPLICATE]
                  </span>
                )}
                {source.fetchedAt && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    checked {timeAgo(source.fetchedAt)}
                  </span>
                )}
              </div>
              {source.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-2 border-l border-border/40">
                  {source.excerpt}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
