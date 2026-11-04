// Local string-based search. This is the honest fallback behind the on-device
// semantic model: if the embedding model cannot load (e.g. no space or an old
// browser), results still come from the catalog — scored in plain JavaScript,
// which is exactly what they are.

import { EntityData } from '@/types/entityTypes';
import { mockEthicalData } from '@/data/mockEthicalData';

export function performFallbackSearch(query: string): EntityData[] {
  const searchTerms = query.toLowerCase().split(/\s+/);

  // First try direct name matching
  const directNameMatches = mockEthicalData.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (directNameMatches.length > 0) {
    return directNameMatches;
  }

  // Score each result based on how well it matches the search terms
  const scoredResults = mockEthicalData.map((item) => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    const categoriesLower = item.categories.map((c) => c.toLowerCase());
    const typeLower = item.type.toLowerCase();

    for (const term of searchTerms) {
      // Direct matches in name (highest priority)
      if (nameLower.includes(term)) score += 15;

      // Matches in description
      if (descLower.includes(term)) score += 7;

      // Matches in categories
      if (categoriesLower.some((cat) => cat.includes(term))) score += 10;

      // Matches in entity type
      if (typeLower.includes(term)) score += 5;

      // Partial word matches (lower priority but still relevant)
      if (nameLower.split(/\s+/).some((word) => word.includes(term) || term.includes(word))) {
        score += 3;
      }
    }

    return { item, score };
  });

  // Sort by score (descending) and filter items with a score above 0
  return scoredResults
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item);
}
