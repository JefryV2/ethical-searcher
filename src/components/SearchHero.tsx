
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    onSearch(searchQuery);
  };

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 fade-in-element">
      <h1 className="ds-text-headline-lg text-center mb-4 max-w-xl">
        Look up what companies and creators actually publish
      </h1>
      <p className="ds-text-body-lg text-muted-foreground text-center mb-8 max-w-xl">
        Evidence compiled from public sources — Wikidata, Wikipedia and the entity's own
        site. No accounts, no API keys, every claim keeps its source.
      </p>
      
      <form onSubmit={handleSubmit} className="search-container">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for a company or creator…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-card border-border"
            disabled={isSearching}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Button 
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 text-sm"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-3 min-h-[18px] flex items-center justify-center">
        {searchStatus && (
          <p className="ds-text-body-sm text-muted-foreground">{searchStatus}</p>
        )}
        {!searchStatus && <ModelStatus />}
      </div>
    </div>
  );
};
