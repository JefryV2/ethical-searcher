interface ExampleItem {
  query: string;
  kind: 'company' | 'creator';
  focus: string;
}

const EXAMPLES: ExampleItem[] = [
  { query: 'Patagonia',        kind: 'company',  focus: 'supply chain audit' },
  { query: 'MrBeast',         kind: 'creator',  focus: 'charitable disclosures' },
  { query: 'Nike',            kind: 'company',  focus: 'labor disputes' },
  { query: 'Unilever',        kind: 'company',  focus: 'sustainability claims' },
  { query: 'Marques Brownlee', kind: 'creator',  focus: 'review disclosures' },
];

export const ExampleQueries = ({
  onSearch,
  isSearching,
}: {
  onSearch: (query: string) => void;
  isSearching?: boolean;
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <div className="border-t border-border pt-6">
        <p className="font-mono text-xs text-muted-foreground mb-4">
          // suggested queries
        </p>

        <div className="space-y-1">
          {EXAMPLES.map(({ query, kind, focus }, i) => (
            <button
              key={query}
              type="button"
              disabled={isSearching}
              onClick={() => onSearch(query)}
              className="w-full flex items-baseline gap-3 px-3 py-2 text-left border border-transparent hover:border-border hover:bg-card transition-colors disabled:opacity-40 group focus:outline-none focus:border-primary"
            >
              <span className="font-mono text-[11px] text-muted-foreground/60 w-4 shrink-0 select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-sm text-primary group-hover:text-primary/90 font-medium min-w-[160px]">
                {query}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {kind} · {focus}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
