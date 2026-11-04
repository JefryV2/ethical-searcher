// On-device semantic search over the entity catalog.
//
// Each catalog entry is embedded with the MiniLM model and ranked against the
// query by cosine similarity. This replaces the earlier keyword matcher that
// was presented as "AI" — here the ranking genuinely comes from a trained
// embedding model running in the browser, and is labeled as such.

import type { EntityData } from '@/types/entityTypes';
import { embedText, embedTexts, cosineSimilarity } from './mlService';

const entryText = (entity: EntityData) =>
  [
    entity.name,
    entity.description,
    entity.categories.join(' '),
    entity.type,
    entity.ethical_analysis ?? '',
  ].join('. ');

export const buildSearchTexts = (entities: EntityData[]): string[] =>
  entities.map(entryText);

export interface SemanticScoredEntity {
  entity: EntityData;
  similarity: number;
}

/**
 * Rank catalog entities against the query with on-device embeddings.
 * Similarities for short queries sit near 0.2-0.5; MIN_OVER_TIER keeps the
 * low-similarity tail out of the results. The top match survives even if its
 * similarity is modest, so single-entity catalogs still answer.
 */
export const rankEntitiesSemantically = async (
  query: string,
  entities: EntityData[],
  options: { minScore?: number } = {},
): Promise<SemanticScoredEntity[]> => {
  const minScore = options.minScore ?? 0.18;
  const [queryVector, docVectors] = await Promise.all([
    embedText(query),
    embedTexts(buildSearchTexts(entities)),
  ]);

  return entities
    .map((entity, index) => ({ entity, similarity: cosineSimilarity(queryVector, docVectors[index]) }))
    .sort((a, b) => b.similarity - a.similarity)
    .filter((entry, index) => entry.similarity >= minScore || index === 0);
};
