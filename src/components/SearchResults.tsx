
import { EntityCard } from './EntityCard';

interface SearchResultsProps {
  results: Array<{
    id: string;
    name: string;
    type: 'company' | 'creator';
    description: string;
    ethicalScore: number;
    categories: string[];
  }>;
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">No Results Found</h2>
        <p className="text-muted-foreground">
          Try searching with different keywords or broader terms
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Search Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <EntityCard key={result.id} {...result} />
        ))}
      </div>
    </div>
  );
};
