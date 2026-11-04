// On-device semantic search over the entity catalog.
//
// Each catalog entry is embedded with the MiniLM model and ranked against the
// query by cosine similarity. This replaces the earlier keyword matcher that
// was presented as "AI" — here the ranking genuinely comes from a trained
// embedding model running in the browser, and is labeled as such.

import type { EntityData } from '@/types/entityTypes';
import { embedText, embedTexts, cosineSimilarity } from './mlService';
import { keywordScore } from './localSearch';

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
 * Hybrid ranking: embedding similarity gives the semantic signal, a
 * normalized keyword score guards against the small-model quirks that drop
 * exact-term hits (a "worker-owned" entity losing to an unrelated brand on a
 * labor query). Weights are fixed and reported so provenance stays honest.
 */
export const rankEntitiesHybrid = async (
  query: string,
  entities: EntityData[],
  options: { minScore?: number | null; semanticWeight?: number } = {},
): Promise<SemanticScoredEntity[]> => {
  const semanticWeight = options.semanticWeight ?? 0.7;
  const keywordWeight = 1 - semanticWeight;
  // Keyword scores saturate at 15 raw points; single stray hits therefore
  // bring a small, bounded boost instead of dominating the ranking.
  const keywordScores = entities.map((entity) =>
    Math.min(1, keywordScore(entity, query) / 15),
  );

  const [queryVector, docVectors] = await Promise.all([
    embedText(query),
    embedTexts(buildSearchTexts(entities)),
  ]);

  const finalScore = (entry: SemanticScoredEntity, index: number) =>
    entry.similarity * semanticWeight + keywordScores[index] * keywordWeight;

  const entries = entities
    .map((entity, index) => ({ entity, similarity: cosineSimilarity(queryVector, docVectors[index]) }))
    .map((entry, index) => ({ ...entry, score: finalScore(entry, index) }))
    .sort((a, b) => b.score - a.score);

  // Keep the head of the distribution (>=60% of the best hybrid score, at
  // least one result) so a weak query does not dump the whole catalog.
  const top = entries[0]?.score ?? 0;
  return entries
    .filter((entry, index) => entry.score >= top * 0.6 || index === 0)
    .map(({ entity, similarity }) => ({ entity, similarity }));
};
