// The regex layer and the NLI model, side by side on the same passages.
//
// The rule layer is fast and literal; MobileBERT reads context. Showing where
// they agree and disagree is more honest than presenting either as truth.

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { SignalKind } from '@/services/scrapeService';
import type { EvidencePassage } from '@/services/passages';
import { compareRulesAndModel, type AgreementReport } from '@/services/modelLab';

interface RuleModelAgreementProps {
  entityId: string;
  passages: EvidencePassage[];
}

const SHORT: Record<SignalKind | 'none', string> = {
  disclosure: 'disclosure',
  sourcing: 'sourcing',
  operations: 'reports',
  controversy_response: 'issue response',
  conflicts: 'funding',
  none: 'none',
};

export const RuleModelAgreement = ({ entityId, passages }: RuleModelAgreementProps) => {
  const [report, setReport] = useState<AgreementReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setReport(await compareRulesAndModel(entityId, passages));
    } catch (err) {
      setError(
        err instanceof Error ? `Comparison failed: ${err.message}` : 'Comparison failed in this browser.',
      );
    } finally {
      setRunning(false);
    }
  };

  if (passages.length === 0) return null;

  return (
    <Card className="dossier-card p-5 space-y-4 font-mono">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
        <h3 className="text-sm font-bold text-foreground">RULES VS MODEL COMPARISON</h3>
        {report && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            [{report.agreed}/{report.total} agree] · {Math.round(report.ms)}ms
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Regex identifies literal keywords; MobileBERT-MNLI classifies semantic entailment against
        neutral transparency criteria. Divergence indicates differing failure modes, not certainty.
      </p>

      {!report && (
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="btn-terminal px-3 py-1.5 text-xs flex items-center gap-2"
        >
          {running ? '[EVALUATING MODEL...]' : '[COMPARE RULES & MODEL]'}
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {report && (
        <ul className="space-y-3 pt-1">
          {report.rows.map((row, index) => (
            <li key={`${row.url}-${index}`} className="border border-border/70 p-3 space-y-2 bg-secondary/20">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="border border-border px-1.5 py-0.5 text-muted-foreground">
                  RULES: {row.ruleKinds.length ? row.ruleKinds.map((kind) => SHORT[kind]).join(', ') : 'none'}
                </span>
                <span className="border border-primary/40 text-primary px-1.5 py-0.5">
                  MODEL: {SHORT[row.modelKind]}{' '}
                  {row.modelKind === 'none'
                    ? `(${Math.round(row.modelScore * 100)}%)`
                    : `${Math.round(row.modelScore * 100)}%`}
                </span>
                <span
                  className={`ml-auto font-bold ${row.agree ? 'score-good' : 'score-mid'}`}
                >
                  {row.agree ? '[AGREE]' : '[DIVERGE]'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{row.text}</p>
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
              >
                view source ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
        <p>
          * The rule layer determines evidence coverage score. Top-label scores below 45% resolve to "none".
        </p>
      </div>
    </Card>
  );
};
