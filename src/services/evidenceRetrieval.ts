// On-device retrieval over a record's evidence passages.
//
// MiniLM embeds every passage once per entity, then a question is embedded
// with the same model and passages are ranked by cosine similarity. The final
// selection uses maximal marginal relevance (MMR) so five near-identical
// sentences do not fill the answer. Nothing here generates text: results are
// the passages themselves, each still pointing at the page it came from.

import { cosineSimilarity, embedText, embedTexts } from './mlService';
import { loadAllEvidenceSnapshots, loadCachedEntities } from './evidenceStore';
import type { EvidencePassage } from './passages';
import type { EntityData } from '@/types/entityTypes';

export interface RetrievedPassage {
  passage: EvidencePassage;
  similarity: number;
  /** The MMR score used to pick this passage. */
  score: number;
}

interface VectorCacheEntry {
  signature: string;
  vectors: number[][];
}

const vectorCache = new Map<string, VectorCacheEntry>();
const BATCH_SIZE = 16;

const signatureOf = (entityId: string, passages: EvidencePassage[]): string =>
  [
    entityId,
    passages.length,
    passages[0]?.text.length ?? 0,
    passages[passages.length - 1]?.text.length ?? 0,
  ].join(':');

/** Embed (and memoize) every passage for one entity. Batched because the
 *  ONNX runtime is happier with small groups than one huge tensor. */
export const getPassageVectors = async (
  entityId: string,
  passages: EvidencePassage[],
): Promise<number[][]> => {
  if (passages.length === 0) return [];
  const signature = signatureOf(entityId, passages);
  const cached = vectorCache.get(entityId);
  if (cached?.signature === signature) return cached.vectors;

  const vectors: number[][] = [];
  for (let i = 0; i < passages.length; i += BATCH_SIZE) {
    const batch = passages.slice(i, i + BATCH_SIZE).map((p) => p.text);
    vectors.push(...(await embedTexts(batch)));
  }
  vectorCache.set(entityId, { signature, vectors });
  return vectors;
};

/** Maximal marginal relevance: pick the most query-relevant passages while
 *  penalizing ones that duplicate an already-picked passage. */
const mmrOrder = (
  queryVector: number[],
  vectors: number[][],
  k: number,
  lambda = 0.72,
): Array<{ index: number; similarity: number; score: number }> => {
  const similarities = vectors.map((v) => cosineSimilarity(queryVector, v));
  const selected: number[] = [];
  const remaining = new Set(vectors.map((_, i) => i));
  const picked: Array<{ index: number; similarity: number; score: number }> = [];

  while (selected.length < Math.min(k, vectors.length) && remaining.size > 0) {
    let best = -1;
    let bestScore = -Infinity;
    for (const index of remaining) {
      let redundancy = 0;
      for (const chosen of selected) {
        redundancy = Math.max(redundancy, cosineSimilarity(vectors[index], vectors[chosen]));
      }
      const score = lambda * similarities[index] - (1 - lambda) * redundancy;
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    }
    if (best < 0) break;
    remaining.delete(best);
    selected.push(best);
    picked.push({ index: best, similarity: similarities[best], score: bestScore });
  }
  return picked;
};

export const retrieveEvidence = async (
  entityId: string,
  passages: EvidencePassage[],
  question: string,
  k = 5,
): Promise<RetrievedPassage[]> => {
  if (passages.length === 0 || !question.trim()) return [];
  const vectors = await getPassageVectors(entityId, passages);
  const queryVector = await embedText(question);
  return mmrOrder(queryVector, vectors, k).map(({ index, similarity, score }) => ({
    passage: passages[index],
    similarity,
    score,
  }));
};

/** A fixed, query-free digest: MMR over a transparency-oriented query so the
 *  bullets stay diverse instead of repeating one paragraph. */
export const buildDigest = async (
  entityId: string,
  passages: EvidencePassage[],
  count = 5,
): Promise<RetrievedPassage[]> =>
  retrieveEvidence(
    entityId,
    passages,
    'transparency disclosure operations sourcing audits impact reports partnerships',
    count,
  );

/** Mean of the passage vectors, re-normalized — a cheap record fingerprint. */
const meanVector = (vectors: number[][]): number[] => {
  if (vectors.length === 0) return [];
  const mean = new Array(vectors[0].length).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < mean.length; i += 1) mean[i] += vector[i];
  }
  let norm = 0;
  for (let i = 0; i < mean.length; i += 1) {
    mean[i] /= vectors.length;
    norm += mean[i] * mean[i];
  }
  norm = Math.sqrt(norm) || 1;
  return mean.map((value) => value / norm);
};

export const getRecordVector = async (
  entityId: string,
  passages: EvidencePassage[],
): Promise<number[]> => meanVector(await getPassageVectors(entityId, passages));

export interface SimilarRecord {
  entity: EntityData;
  similarity: number;
}

/** Compare this record against the live records cached from earlier searches
 *  in this tab. Only records that still have passages are comparable. */
export const findSimilarRecords = async (
  entity: EntityData,
  passages: EvidencePassage[],
  limit = 3,
): Promise<SimilarRecord[]> => {
  if (passages.length === 0) return [];
  const snapshots = new Map(
    loadAllEvidenceSnapshots().map((snapshot) => [String(snapshot.entityId), snapshot]),
  );
  const candidates = loadCachedEntities()
    .filter((other) => String(other.id) !== String(entity.id))
    .map((other) => ({
      entity: other,
      passages: (snapshots.get(String(other.id))?.passages ?? []).slice(0, 12),
    }))
    .filter((candidate) => candidate.passages.length >= 3)
    .slice(0, 5);

  if (candidates.length === 0) return [];

  const currentVector = await getRecordVector(entity.id, passages);
  const scored = await Promise.all(
    candidates.map(async (candidate) => ({
      entity: candidate.entity,
      similarity: cosineSimilarity(
        currentVector,
        await getRecordVector(candidate.entity.id, candidate.passages),
      ),
    })),
  );

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
};

export interface ProjectionPoint {
  x: number;
  y: number;
  index: number;
}

export interface Projection {
  points: ProjectionPoint[];
  query?: { x: number; y: number };
  explained: [number, number];
}

/** Power iteration for the top principal direction, then deflation for the
 *  second. Enough for a 2-D sketch of a 384-dim passage cloud. */
const topDirection = (rows: number[][], iterations = 60): number[] => {
  const dims = rows[0]?.length ?? 0;
  let vector = new Array(dims).fill(0).map((_, i) => Math.sin(i + 1));
  for (let step = 0; step < iterations; step += 1) {
    const next = new Array(dims).fill(0);
    for (const row of rows) {
      const dot = row.reduce((sum, value, i) => sum + value * vector[i], 0);
      for (let i = 0; i < dims; i += 1) next[i] += dot * row[i];
    }
    const norm = Math.sqrt(next.reduce((sum, value) => sum + value * value, 0)) || 1;
    vector = next.map((value) => value / norm);
  }
  return vector;
};

const dot = (a: number[], b: number[]): number =>
  a.reduce((sum, value, i) => sum + value * b[i], 0);

export const projectPassages = (
  vectors: number[][],
  queryVector?: number[],
): Projection | null => {
  if (vectors.length < 3) return null;
  const dims = vectors[0].length;
  const mean = new Array(dims).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < dims; i += 1) mean[i] += vector[i] / vectors.length;
  }
  const centered = vectors.map((vector) => vector.map((value, i) => value - mean[i]));
  const axis1 = topDirection(centered);
  const deflated = centered.map((row) => {
    const projection = dot(row, axis1);
    return row.map((value, i) => value - projection * axis1[i]);
  });
  const axis2 = topDirection(deflated);

  const raw = centered.map((row) => ({ x: dot(row, axis1), y: dot(row, axis2) }));
  const queryRaw = queryVector
    ? { x: dot(queryVector.map((v, i) => v - mean[i]), axis1), y: dot(queryVector.map((v, i) => v - mean[i]), axis2) }
    : undefined;

  const allX = [...raw.map((p) => p.x), ...(queryRaw ? [queryRaw.x] : [])];
  const allY = [...raw.map((p) => p.y), ...(queryRaw ? [queryRaw.y] : [])];
  const span = (values: number[]): { min: number; max: number } => ({
    min: Math.min(...values),
    max: Math.max(...values),
  });
  const xSpan = span(allX);
  const ySpan = span(allY);
  const scale = (value: number, { min, max }: { min: number; max: number }): number =>
    max - min < 1e-9 ? 0 : ((value - min) / (max - min)) * 2 - 1;

  const totalVariance = centered.reduce(
    (sum, row) => sum + row.reduce((inner, value) => inner + value * value, 0),
    0,
  ) || 1;
  const var1 = centered.reduce((sum, row) => sum + dot(row, axis1) ** 2, 0);
  const var2 = deflated.reduce((sum, row) => sum + dot(row, axis2) ** 2, 0);

  return {
    points: raw.map((point, index) => ({
      index,
      x: scale(point.x, xSpan),
      y: scale(point.y, ySpan),
    })),
    query: queryRaw
      ? { x: scale(queryRaw.x, xSpan), y: scale(queryRaw.y, ySpan) }
      : undefined,
    explained: [
      Math.round((var1 / totalVariance) * 100),
      Math.round((var2 / totalVariance) * 100),
    ],
  };
};
