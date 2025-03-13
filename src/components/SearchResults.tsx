
import { EntityCard } from './EntityCard';
import { Search } from 'lucide-react';
import { EntityData } from '@/services/ethicalDataService';

interface SearchResultsProps {
  results: EntityData[];
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  console.log("SearchResults component received results:", results);
  
  if (!results || results.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="bg-secondary/20 rounded-lg p-8 max-w-lg mx-auto">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">No Results Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find any companies or creators matching your search criteria.
          </p>
          <div className="text-sm text-muted-foreground mt-4">
            <h3 className="font-medium mb-2">Suggestions:</h3>
            <ul className="list-disc list-inside text-left">
              <li>Check your spelling</li>
              <li>Try more general keywords</li>
              <li>Search for related terms</li>
              <li>Try searching for categories like "Environmental" or "Technology"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Search Results ({results.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <EntityCard key={result.id} {...result} />
        ))}
      </div>
    </div>
  );
};
