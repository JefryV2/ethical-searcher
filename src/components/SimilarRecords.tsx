// Record-to-record similarity using the cached live records in this tab.
//
// Each record is represented by the mean of its passage embeddings, then
// compared with cosine similarity. This is a demonstration of the same
// embedding space used by retrieval, not a recommendation engine.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import type { EntityData } from '@/types/entityTypes';
import type { EvidencePassage } from '@/services/passages';
import { findSimilarRecords, type SimilarRecord } from '@/services/evidenceRetrieval';
import { isEmbedderReady } from '@/services/mlService';

interface SimilarRecordsProps {
  entity: EntityData;
  passages: EvidencePassage[];
}

export const SimilarRecords = ({ entity, passages }: SimilarRecordsProps) => {
  const [records, setRecords] = useState<SimilarRecord[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setRecords(await findSimilarRecords(entity, passages));
    } catch (err) {
      setError(
        err instanceof Error ? `Similarity check failed: ${err.message}` : 'Similarity check failed.',
      );
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isEmbedderReady()) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.id]);

  if (passages.length < 3) return null;

  return (
    <Card className="dossier-card p-5 space-y-3 font-mono">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
        <h2 className="text-sm font-bold text-foreground">SIMILAR RECORDS</h2>
      </div>

      {records === null && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="btn-terminal px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            {running ? '[COMPARING...]' : '[COMPARE CACHED RECORDS]'}
          </button>
          <p className="text-[10px] text-muted-foreground">
            Compares records in memory via local embeddings.
          </p>
        </div>
      )}

      {records && records.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No other live records cached in this session. Search more records to compare.
        </p>
      )}

      {records && records.length > 0 && (
        <ul className="space-y-2">
          {records.map((record) => (
            <li key={record.entity.id} className="flex items-center gap-2 min-w-0 text-xs">
              <span className="text-primary font-bold">↳</span>
              <Link
                to={`/entity/${record.entity.id}`}
                className="hover:text-primary truncate font-medium"
              >
                {record.entity.name}
              </Link>
              <span className="ml-auto shrink-0 font-mono text-primary font-bold">
                {Math.round(record.similarity * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2">
        <span>* Cosine similarity of passage embeddings. Measures topical proximity.</span>
      </div>
    </Card>
  );
};
