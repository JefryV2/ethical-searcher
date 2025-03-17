
import { EntityCard } from '@/components/EntityCard';
import { EntityData } from '@/services/ethicalDataService';
import { Link } from 'react-router-dom';

interface SearchResultsProps {
  results: EntityData[];
}

export const SearchResults = ({ results }: SearchResultsProps) => {
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
      <h2 className="text-2xl font-bold mb-6">Search Results</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {results.map((entity) => (
          <Link to={`/entity/${entity.id}`} key={entity.id} className="block transition-all">
            <EntityCard {...entity} />
          </Link>
        ))}
      </div>
    </div>
  );
};
