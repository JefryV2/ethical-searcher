
import { Search, Building2, User } from 'lucide-react';

/* Worked examples instead of an invented leaderboard: each chip runs a real
   lookup through the same pipeline as the search box, so what the visitor
   sees is what the scraper actually produced. */
const EXAMPLES: { query: string; kind: 'company' | 'creator' }[] = [
  { query: 'Patagonia', kind: 'company' },
  { query: 'MrBeast', kind: 'creator' },
  { query: 'Nike', kind: 'company' },
  { query: 'Unilever', kind: 'company' },
  { query: 'Marques Brownlee', kind: 'creator' },
];

export const ExampleQueries = ({
  onSearch,
  isSearching,
}: {
  onSearch: (query: string) => void;
  isSearching?: boolean;
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-14 fade-in-element">
      <h2 className="ds-text-label-sm text-muted-foreground uppercase tracking-wider text-center mb-3">
        Try an example — live lookup, no sample scores
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map(({ query, kind }) => (
          <button
            key={query}
            type="button"
            disabled={isSearching}
            onClick={() => onSearch(query)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground ds-text-body-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {kind === 'company' ? (
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {query}
            <Search className="w-3 h-3 text-muted-foreground/60" />
          </button>
        ))}
      </div>
    </div>
  );
};
