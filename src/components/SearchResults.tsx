
import { EntityCard } from '@/components/EntityCard';
import { EntityData } from '@/types/entityTypes';
import { Link } from 'react-router-dom';
import type { BuiltEntity } from '@/services/lookupService';

interface SearchResultsProps {
  results: EntityData[];
  /** Scraped source bundles keyed by entity id, for live records. */
  evidenceMap?: Record<string, BuiltEntity>;
}

export const SearchResults = ({ results, evidenceMap = {} }: SearchResultsProps) => {
  // Store search results in sessionStorage for later reference
  if (results.length > 0) {
    sessionStorage.setItem('lastSearchResults', JSON.stringify(results));
  }
  
  if (results.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">No Results Found</h3>
          <p className="text-muted-foreground">
            Try searching for a different company, brand, or creator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h2 className="ds-text-headline-sm mb-6">Search Results</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {results.map((entity) => (
          <Link 
            to={`/entity/${entity.id}`} 
            key={entity.id} 
            className="block transition-colors"
          >
            <EntityCard {...entity} linked evidence={evidenceMap[entity.id]} />
          </Link>
        ))}
      </div>
    </div>
  );
};
