// Query-to-record similarity for disambiguating search results.
//
// Wikidata search can return several records with the same label ("Nike"
// matches the company, a deity and other items). Once the on-device embedding
// model is warm, this scores each candidate's name + description against the
// query so the closest record can be surfaced first — with the number shown,
// not hidden behind a ranking claim.

import { cosineSimilarity, embedText, embedTexts } from './mlService';
import type { EntityData } from '@/types/entityTypes';

export const scoreQueryMatch = async (
  query: string,
  entities: EntityData[],
): Promise<Record<string, number>> => {
  if (entities.length === 0 || !query.trim()) return {};
  // The app only audits companies and creators, so the query is embedded in
  // that scope. Without it a bare query like "Nike" ranks the given-name page
  // above the company simply because the string matches the title.
  const [queryVector, vectors] = await Promise.all([
    embedText(`${query.trim()}. company or content creator`),
    embedTexts(entities.map((entity) => `${entity.name}. ${entity.description}`)),
  ]);
  return Object.fromEntries(
    entities.map((entity, index) => [entity.id, cosineSimilarity(queryVector, vectors[index])]),
  );
};
