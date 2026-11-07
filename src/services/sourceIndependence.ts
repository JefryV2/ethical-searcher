// "6 sources" is only meaningful if they are independent. This groups sources
// whose text is nearly identical (syndicated press releases, the same blurb
// repeated on several pages) using MiniLM embeddings, so the record can say
// "6 sources, 4 independent" instead of inflating the count.

import type { SourceRef } from '@/types/entityTypes';
import { cosineSimilarity, embedTexts } from './mlService';
import type { EvidencePassage } from './passages';

export interface IndependenceCluster {
  /** Index into the original sources array. */
  representative: number;
  members: number[];
}

export interface IndependenceResult {
  total: number;
  independent: number;
  clusters: IndependenceCluster[];
  /** source index → representative index it duplicates. */
  duplicateOf: Record<number, number>;
  threshold: number;
}

const cache = new Map<string, { signature: string; result: IndependenceResult }>();
const DEFAULT_THRESHOLD = 0.92;

const signatureOf = (entityId: string, sources: SourceRef[]): string =>
  `${entityId}:${sources.length}:${sources.map((s) => s.url).join('|').length}`;

/** Sources without readable text cannot be judged; platform handles and the
 *  bare Wikidata description are excluded so we never call a YouTube link a
 *  duplicate of a Wikipedia article. */
const isComparable = (source: SourceRef): boolean =>
  source.provider === 'wikipedia' || source.provider === 'website';

const textFor = (source: SourceRef, passages: EvidencePassage[]): string => {
  const matching = passages.find((passage) => passage.url === source.url);
  if (matching) return matching.text.slice(0, 600);
  if (source.excerpt) return `${source.title}. ${source.excerpt}`.slice(0, 600);
  return source.title;
};

export const analyzeSourceIndependence = async (
  entityId: string,
  sources: SourceRef[],
  passages: EvidencePassage[],
  threshold = DEFAULT_THRESHOLD,
): Promise<IndependenceResult | null> => {
  const comparable = sources
    .map((source, index) => ({ source, index }))
    .filter(({ source }) => isComparable(source));
  if (comparable.length < 3) return null;

  const signature = signatureOf(entityId, sources);
  const cached = cache.get(entityId);
  if (cached?.signature === signature) return cached.result;

  const texts = comparable.map(({ source }) => textFor(source, passages));
  const vectors = await embedTexts(texts);

  const clusters: IndependenceCluster[] = [];
  const duplicateOf: Record<number, number> = {};

  vectors.forEach((vector, position) => {
    let bestCluster = -1;
    let bestSimilarity = threshold;
    clusters.forEach((cluster, clusterIndex) => {
      const similarity = cosineSimilarity(
        vector,
        vectors[comparable.findIndex((c) => c.index === cluster.representative)],
      );
      if (similarity >= bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = clusterIndex;
      }
    });
    const sourceIndex = comparable[position].index;
    if (bestCluster >= 0) {
      clusters[bestCluster].members.push(sourceIndex);
      duplicateOf[sourceIndex] = clusters[bestCluster].representative;
    } else {
      clusters.push({ representative: sourceIndex, members: [sourceIndex] });
    }
  });

  const result: IndependenceResult = {
    total: comparable.length,
    independent: clusters.length,
    clusters,
    duplicateOf,
    threshold,
  };
  cache.set(entityId, { signature, result });
  return result;
};
