import { useState } from 'react';
import { ModelStatus } from '@/components/ModelStatus';

export const SearchHero = ({ 
  onSearch, 
  isSearching,
  searchStatus 
}: { 
  onSearch: (query: string) => void;
  isSearching?: boolean;
  searchStatus?: string | null;
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="pt-14 pb-10 md:pt-20 md:pb-14 max-w-4xl mx-auto px-4 font-mono">
      {/* System banner — single line of context */}
      <div className="text-xs text-muted-foreground mb-8">
        <span className="text-primary font-bold">TRNSPR</span> v0.1 — wikidata · wikipedia · domain audit · on-device ONNX
      </div>

      {/* Headline as a prompt output */}
      <div className="mb-10 space-y-2">
        <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight tracking-tight">
          What does the public record say?
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Zero PR summaries. Zero editorial inference. Primary records only: Wikidata structures,
          Wikipedia dispute archives, and live audits of registered web domains.
          Every claim retains its original URL and retrieval timestamp.
        </p>
      </div>

      {/* Search — terminal prompt aesthetic */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-stretch border border-border hover:border-primary/50 focus-within:border-primary transition-colors bg-card">
          {/* Prompt symbol */}
          <div className="flex items-center px-3 border-r border-border text-primary font-mono text-sm font-bold select-none shrink-0">
            &gt;_
          </div>
          <input
            type="text"
            placeholder="company name, creator, or wikidata QID (e.g. Q95)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-12 px-3 text-xs sm:text-sm bg-transparent text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none"
            disabled={isSearching}
            spellCheck={false}
            autoComplete="off"
          />
          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-3 text-muted-foreground hover:text-primary transition-colors font-mono text-xs"
              aria-label="Clear"
            >
              [x]
            </button>
          )}
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="btn-terminal px-5 h-12 shrink-0 border-0 border-l border-border flex items-center gap-2 disabled:opacity-30"
          >
            {isSearching ? (
              <span>[AUDITING...]</span>
            ) : (
              <span>EXECUTE</span>
            )}
          </button>
        </div>
      </form>

      {/* Status line */}
      <div className="mt-3 h-5 flex items-center status-line font-mono text-xs">
        {searchStatus ? (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <span className="font-bold">&gt;&gt;</span>
            <span>{searchStatus}</span>
          </div>
        ) : (
          <ModelStatus />
        )}
      </div>
    </div>
  );
};
