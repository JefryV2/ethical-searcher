
import { EntityCard } from '@/components/EntityCard';
import { EntityData } from '@/types/entityTypes';
import { Link } from 'react-router-dom';
import type { BuiltEntity } from '@/services/lookupService';

interface SearchResultsProps {
  results: EntityData[];
  /** Scraped source bundles keyed by entity id, for live records. */
  evidenceMap?: Record<string, BuiltEntity>;
  /** Optional query-to-record embedding similarity, keyed by entity id.
   *  When present, results are ordered by it and each card shows the score. */
  similarities?: Record<string, number>;
}

export const SearchResults = ({
  results,
  evidenceMap = {},
  similarities,
}: SearchResultsProps) => {
  // Store search results in sessionStorage for later reference
  if (results.length > 0) {
    sessionStorage.setItem('lastSearchResults', JSON.stringify(results));
  }
  
  if (results.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-border p-8 font-mono">
        <h3 className="text-xs font-bold mb-1 text-foreground">[NO RECORDS MATCHED]</h3>
        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Zero public entries matched this filter. Refine search parameters or clear filters.
        </p>
      </div>
    );
  }

  const ordered = similarities
    ? [...results].sort(
        (a, b) => (similarities[b.id] ?? 0) - (similarities[a.id] ?? 0),
      )
    : results;

  return (
    <div className="grid gap-4 md:grid-cols-2 pt-2">
      {ordered.map((entity) => (
        <Link 
          to={`/entity/${entity.id}`} 
          key={entity.id} 
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <EntityCard
            {...entity}
            linked
            evidence={evidenceMap[entity.id]}
            similarity={similarities?.[entity.id]}
          />
        </Link>
      ))}
    </div>
  );
};
// (re-transform marker: keep the similarity prop in sync with Index)
