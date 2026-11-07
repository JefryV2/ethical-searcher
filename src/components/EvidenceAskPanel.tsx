// "Ask the evidence": retrieval, not generation.
//
// MiniLM embeds the record's passages once, the question is embedded with the
// same model, and MMR picks five diverse passages. Nothing is written by a
// model — every line shown is quoted text with the page it came from.

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ModelStatus } from '@/components/ModelStatus';
import type { EntityData } from '@/types/entityTypes';
import type { EvidencePassage } from '@/services/passages';
import {
  buildDigest,
  getPassageVectors,
  projectPassages,
  retrieveEvidence,
  type Projection,
  type RetrievedPassage,
} from '@/services/evidenceRetrieval';
import { embedText } from '@/services/mlService';

interface EvidenceAskPanelProps {
  entity: EntityData;
  passages: EvidencePassage[];
}

const SUGGESTIONS = [
  'What does it say about factory audits?',
  'Are labour issues mentioned?',
  'Where are sponsorships disclosed?',
  'Does it publish impact reports?',
];

const shortUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const PassageMap = ({
  projection,
  passages,
  highlighted,
}: {
  projection: Projection;
  passages: EvidencePassage[];
  highlighted: Set<number>;
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover !== null ? passages[hover] : null;

  return (
    <div className="space-y-2 font-mono">
      <svg viewBox="0 0 320 180" className="w-full h-44 bg-secondary/20 border border-border" role="img" aria-label="Passage embedding map">
        <line x1="160" y1="8" x2="160" y2="172" className="stroke-border/70" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="8" y1="90" x2="312" y2="90" className="stroke-border/70" strokeWidth="0.5" strokeDasharray="2 2" />
        {projection.points.map((point) => {
          const isHighlighted = highlighted.has(point.index);
          return (
            <circle
              key={point.index}
              cx={160 + point.x * 140}
              cy={90 - point.y * 70}
              r={isHighlighted ? 4 : 2.5}
              className={`${
                isHighlighted ? 'text-primary' : 'text-muted-foreground'
              } cursor-pointer transition-all hover:scale-150`}
              fill="currentColor"
              opacity={isHighlighted ? 1 : 0.4}
              tabIndex={0}
              role="button"
              aria-label={`Passage: ${passages[point.index]?.title ?? 'evidence'}`}
              onMouseEnter={() => setHover(point.index)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(point.index)}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setHover(point.index);
                }
              }}
            >
              <title>{passages[point.index]?.title}</title>
            </circle>
          );
        })}
        {projection.query && (
          <g className="text-primary">
            <circle cx={160 + projection.query.x * 140} cy={90 - projection.query.y * 70} r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={160 + projection.query.x * 140} cy={90 - projection.query.y * 70} r="1.5" fill="currentColor" />
          </g>
        )}
      </svg>
      <p className="text-[10px] text-muted-foreground">
        PCA projection: {passages.length} passages · PC1 {projection.explained[0]}% · PC2{' '}
        {projection.explained[1]}% · ring = query vector
      </p>
      {active && (
        <p className="text-xs text-foreground/80 line-clamp-2 border-l-2 border-primary/50 pl-2">
          {active.title}: {active.text}
        </p>
      )}
    </div>
  );
};

const ResultRow = ({ result }: { result: RetrievedPassage }) => (
  <div className="border border-border p-3 space-y-1.5 font-mono bg-secondary/20">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] border border-primary/40 text-primary px-1.5 py-0.5">
        {Math.round(result.similarity * 100)}% SIM
      </span>
      <span className="text-xs text-muted-foreground truncate min-w-0 font-medium">
        {result.passage.title}
      </span>
    </div>
    <p className="text-xs text-foreground/80 leading-relaxed">{result.passage.text}</p>
    <a
      href={result.passage.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
    >
      <span>↳</span> {shortUrl(result.passage.url)} ↗
    </a>
  </div>
);

export const EvidenceAskPanel = ({ entity, passages }: EvidenceAskPanelProps) => {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [results, setResults] = useState<RetrievedPassage[]>([]);
  const [digest, setDigest] = useState<RetrievedPassage[]>([]);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passagesRef = useRef(passages);
  passagesRef.current = passages;
  const signature = passages.map((p) => p.id).join('|');

  useEffect(() => {
    const current = passagesRef.current;
    if (current.length < 3) return;
    let cancelled = false;
    setLoadingDigest(true);
    setError(null);

    (async () => {
      try {
        const rows = await buildDigest(entity.id, current, 5);
        if (cancelled) return;
        setDigest(rows);
        const vectors = await getPassageVectors(entity.id, current);
        if (cancelled) return;
        setProjection(projectPassages(vectors));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `The on-device model could not run: ${err.message}`
              : 'The on-device model could not run in this browser.',
          );
        }
      } finally {
        if (!cancelled) setLoadingDigest(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entity.id, signature]);

  const ask = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || passages.length < 3) return;
    setRunning(true);
    setError(null);
    setAsked(trimmed);
    try {
      const rows = await retrieveEvidence(entity.id, passages, trimmed, 5);
      setResults(rows);
      const [vectors, queryVector] = await Promise.all([
        getPassageVectors(entity.id, passages),
        embedText(trimmed),
      ]);
      setProjection(projectPassages(vectors, queryVector));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Retrieval failed: ${err.message}`
          : 'Retrieval failed in this browser.',
      );
      setResults([]);
    } finally {
      setRunning(false);
    }
  };

  if (passages.length < 3) {
    return (
      <Card className="dossier-card p-6 space-y-2 font-mono">
        <p className="text-xs text-destructive font-bold">[!] NO RETRIEVED PASSAGES AVAILABLE</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Retrieval matches against text extracted from live domain crawls.
          Fallback catalog items contain no raw crawled text passages.
        </p>
      </Card>
    );
  }

  const highlighted = new Set(
    results.map((result) => passages.findIndex((p) => p.id === result.passage.id)),
  );

  return (
    <div className="space-y-6 font-mono">
      <Card className="dossier-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
          <h2 className="text-sm font-bold text-foreground">QUERY RECORD PASSAGES</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          Cosine search over {passages.length} passages extracted from primary sources.
          All returned rows are literal excerpts with source origin.
        </p>

        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
        >
          <div className="relative flex-1 flex items-center border border-border bg-card">
            <span className="px-3 text-primary text-xs font-bold select-none">&gt;_</span>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. factory audit disclosures, supplier codes..."
              aria-label="Question about this record"
              className="flex-1 h-10 pr-3 text-xs bg-transparent text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={running || !question.trim()}
            className="btn-terminal px-4 h-10 text-xs shrink-0 flex items-center justify-center gap-1.5"
          >
            {running ? '[SEARCHING...]' : '[MATCH EVIDENCE]'}
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                void ask(suggestion);
              }}
              className="text-[11px] border border-border px-2.5 py-1 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {(running || loadingDigest) && (
          <div className="pt-1">
            <ModelStatus />
          </div>
        )}
      </Card>

      {error && (
        <Card className="dossier-card p-4">
          <p className="text-xs text-destructive font-bold">[!] {error}</p>
        </Card>
      )}

      {asked && results.length > 0 && (
        <Card className="dossier-card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
            <h3 className="text-xs font-bold text-foreground">MATCHES FOR: "{asked}"</h3>
            <span className="ml-auto text-[10px] text-muted-foreground">
              [MMR-FILTERED: {results.length}]
            </span>
          </div>
          <div className="space-y-2.5">
            {results.map((result) => (
              <ResultRow key={result.passage.id} result={result} />
            ))}
          </div>
        </Card>
      )}

      {asked && !running && results.length === 0 && !error && (
        <Card className="dossier-card p-4">
          <p className="text-xs text-muted-foreground">
            No passage met the minimal similarity threshold. Refine query keywords.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card className="dossier-card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
            <h3 className="text-xs font-bold text-foreground">EXTRACTIVE PASSAGE DIGEST</h3>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {loadingDigest ? '[COMPILING...]' : `[${digest.length} EXTRACTS]`}
            </span>
          </div>
          {digest.length === 0 && loadingDigest && (
            <p className="text-xs text-primary animate-pulse">
              Computing embeddings and extracting core passages...
            </p>
          )}
          <ol className="space-y-3 list-none">
            {digest.map((row, i) => (
              <li key={row.passage.id} className="text-xs space-y-1 border-l-2 border-border/60 pl-2.5">
                <p className="text-foreground/80 leading-relaxed">
                  <span className="text-primary font-bold mr-1.5">[{i + 1}]</span>
                  {row.passage.text}
                </p>
                <a
                  href={row.passage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>↳</span> source ↗
                </a>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="dossier-card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
            <h3 className="text-xs font-bold text-foreground">PASSAGE VECTOR PROJECTION</h3>
          </div>
          {projection ? (
            <PassageMap projection={projection} passages={passages} highlighted={highlighted} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Embedding space renders upon model initialization.
            </p>
          )}
        </Card>
      </div>

      <div className="text-[10px] text-muted-foreground border-l-2 border-border/80 pl-2">
        <p>
          * MiniLM distance reflects semantic proximity to search terms, not factual accuracy.
          Always inspect raw sources via external links.
        </p>
      </div>
    </div>
  );
};
