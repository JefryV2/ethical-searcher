// A one-line status strip for the on-device models. It renders nothing while
// everything is idle, and shows download/inference progress while a pipeline
// is loading — first search on a cold cache gives the user real feedback
// instead of a silent spinner.

import { useEffect, useState } from 'react';
import { subscribeModelProgress, type ModelProgress } from '@/services/mlService';

const TASK_LABELS: Record<ModelProgress['task'], string> = {
  embeddings: 'MiniLM semantics',
  'zero-shot': 'MobileBERT analysis',
};

export const ModelStatus = () => {
  const [status, setStatus] = useState<ModelProgress | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeModelProgress((p) => {
      if (p.status === 'done') {
        setStatus(null);
        return;
      }
      setStatus(p);
    });
    return unsubscribe;
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
      <span className="font-bold select-none">[ML RUN]</span>
      <span>
        Loading {TASK_LABELS[status.task]}
        {status.progress >= 0 ? ` [${Math.round(status.progress)}%]` : '...'}
      </span>
    </div>
  );
};
