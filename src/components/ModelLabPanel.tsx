// A live, reproducible sanity check for the two on-device models.
//
// The probe set is small and hand-labeled on purpose: it is not a benchmark,
// but every accuracy, confusion-matrix cell and latency number below is
// computed in this browser, from those fixtures, when you press the button.

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  EMBEDDING_PROBES,
  NLI_PROBES,
  RULE_PROBES,
  runModelLab,
  type LabReport,
} from '@/services/modelLab';
import { ModelStatus } from '@/components/ModelStatus';

const pct = (correct: number, total: number) => (total === 0 ? '—' : `${Math.round((correct / total) * 100)}%`);

const Metric = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="border border-border p-3 font-mono bg-card">
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    <p className="text-lg font-bold text-foreground">{value}</p>
    {note && <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>}
  </div>
);

export const ModelLabPanel = () => {
  const [report, setReport] = useState<LabReport | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setReport(await runModelLab(setProgress));
    } catch (err) {
      setError(
        err instanceof Error ? `The lab could not finish: ${err.message}` : 'The lab could not finish.',
      );
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <Card className="dossier-card p-5 space-y-4 font-mono">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
        <h3 className="text-sm font-bold text-foreground">MODEL BENCHMARK LAB</h3>
        {report && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            [RAN {new Date(report.ranAt).toLocaleTimeString()}]
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {EMBEDDING_PROBES.length} retrieval probes, {NLI_PROBES.length} entailment probes, and{' '}
        {RULE_PROBES.length} regex probes evaluated live in-memory. Includes adversarial probes
        (negation, implicit assertion).
      </p>

      {!report && (
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="btn-terminal px-3 py-1.5 text-xs flex items-center gap-2"
        >
          {running ? '[EXECUTING BENCHMARK...]' : '[EXECUTE LAB PROBES]'}
        </button>
      )}

      {running && (
        <div className="space-y-2 border-l-2 border-primary/50 pl-2 py-1">
          {progress && <p className="text-xs text-primary animate-pulse">{progress}</p>}
          <ModelStatus />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {report && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Metric
              label="Embedding Top-1"
              value={pct(report.embedding.correct, report.embedding.total)}
              note={`${report.embedding.correct}/${report.embedding.total} · ${Math.round(report.embedding.ms)}ms`}
            />
            <Metric
              label="NLI Accuracy"
              value={pct(report.nli.correct, report.nli.total)}
              note={`${report.nli.correct}/${report.nli.total} · ${Math.round(report.nli.ms)}ms`}
            />
            <Metric
              label="Rule Accuracy"
              value={pct(report.rules.correct, report.rules.total)}
              note={`${report.rules.correct}/${report.rules.total} · ${Math.round(report.rules.ms)}ms`}
            />
            <Metric
              label="Cosine Margin"
              value={report.embedding.avgMargin.toFixed(3)}
              note="top minus second"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-border p-3 space-y-2 bg-secondary/20">
              <p className="text-xs font-bold text-foreground">NLI Confusion Matrix</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/40">
                    <th className="text-left font-normal py-1">actual</th>
                    <th className="text-right font-normal py-1">pred +</th>
                    <th className="text-right font-normal py-1">pred −</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  <tr>
                    <td className="py-1">positive</td>
                    <td className="text-right score-good font-bold">{report.nli.matrix.positive.positive}</td>
                    <td className="text-right text-muted-foreground">{report.nli.matrix.positive.negative}</td>
                  </tr>
                  <tr>
                    <td className="py-1">negative</td>
                    <td className="text-right text-muted-foreground">{report.nli.matrix.negative.positive}</td>
                    <td className="text-right score-good font-bold">{report.nli.matrix.negative.negative}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border border-border p-3 space-y-2 bg-secondary/20">
              <p className="text-xs font-bold text-foreground">Rule Layer Discrepancies</p>
              {report.rules.misses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Zero misses on this probe set. Regexes successfully captured all pattern fixtures.
                </p>
              ) : (
                <ul className="space-y-1">
                  {report.rules.misses.map((miss) => (
                    <li key={miss.text} className="text-[11px] text-muted-foreground">
                      expected {miss.expected}, got {miss.got.length ? miss.got.join(', ') : 'none'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2">
            <p>
              * all-MiniLM-L6-v2 (384-dim embeddings) &amp; mobilebert-uncased-mnli executed via local ONNX runtime.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
