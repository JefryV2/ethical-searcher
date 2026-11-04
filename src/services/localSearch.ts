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
  const scoredResults = mockEthicalData.map((item) => ({
    entity: item,
    score: keywordScore(item, query, searchTerms),
  }));

  // Sort by score (descending) and filter items with a score above 0
  return scoredResults
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.entity);
}

/** Additive substring score over name, description, categories and type. */
export const keywordScore = (
  item: EntityData,
  query: string,
  searchTerms: string[] = query.toLowerCase().split(/\s+/),
): number => {
  let score = 0;
  const nameLower = item.name.toLowerCase();
  const descLower = item.description.toLowerCase();
  const categoriesLower = item.categories.map((c) => c.toLowerCase());
  const typeLower = item.type.toLowerCase();

  const containsAny = (haystack: string, term: string) => haystack.includes(term);

  for (const term of searchTerms) {
    // Simple morphological variants so "workers" still hits "Worker-owned".
    const stems = [term];
    const stem = term.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
    if (stem && stem !== term) stems.push(stem);

    const hit = (haystack: string) => stems.some((t) => containsAny(haystack, t));

    // Direct matches in name (highest priority)
    if (hit(nameLower)) score += 15;

    // Matches in description
    if (hit(descLower)) score += 7;

    // Matches in categories
    if (categoriesLower.some((cat) => stems.some((t) => containsAny(cat, t)))) score += 10;

    // Matches in entity type
    if (hit(typeLower)) score += 5;

    // Partial word matches in the name (lowest tier)
    if (nameLower.split(/\s+/).some((word) =>
      stems.some((t) => word.includes(t) || t.includes(word)),
    )) {
      score += 3;
    }
  }

  return score;
};
