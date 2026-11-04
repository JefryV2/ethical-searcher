// Real machine learning that runs entirely in the browser — no API key required.
//
// Two models are lazy-loaded from the Hugging Face CDN the first time they are
// needed, then kept in memory for the session:
//
//  1. all-MiniLM-L6-v2  — sentence embeddings (MiniLM, 384-dim) used to rank the
//     catalog by cosine similarity, replacing keyword string matching.
//  2. mobilebert-uncased-mnli — an MNLI NLI head used for zero-shot
//     entailment scoring in the transparency engine.
//
// Every result built on these models is reported with its provenance label
// ("on-device model") so callers can show where a number came from.

import { pipeline, env } from '@huggingface/transformers';

// Models are fetched from the Hugging Face CDN and run through ONNX at runtime.
env.allowLocalModels = false;

const EMBEDDING_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const NLI_MODEL_ID = 'Xenova/mobilebert-uncased-mnli';

export const MODELS = {
  embeddings: EMBEDDING_MODEL_ID,
  zeroShot: NLI_MODEL_ID,
} as const;

// Keep the tasks loose — the library's union return type is not worth fighting
// across versions; we only rely on the call signatures documented below.
type Embedder = (
  input: string | string[],
  options?: { pooling: 'mean'; normalize: boolean },
) => Promise<{ tolist: () => number[][] }>;

type ZeroShotClassifier = (
  sequence: string,
  labels: string[],
  options?: { hypothesisTemplate?: string },
) => Promise<{ sequence: string; labels: string[]; scores: number[] }>;

let embedderJob: Promise<Embedder> | null = null;
let classifierJob: Promise<ZeroShotClassifier> | null = null;

export const getEmbedder = (): Promise<Embedder> => {
  if (!embedderJob) {
    console.log('[ml] loading embedding model:', EMBEDDING_MODEL_ID);
    embedderJob = pipeline('feature-extraction', EMBEDDING_MODEL_ID) as unknown as Promise<Embedder>;
  }
  return embedderJob;
};

export const getZeroShotClassifier = (): Promise<ZeroShotClassifier> => {
  if (!classifierJob) {
    console.log('[ml] loading NLI model:', NLI_MODEL_ID);
    classifierJob = pipeline('zero-shot-classification', NLI_MODEL_ID) as unknown as Promise<ZeroShotClassifier>;
  }
  return classifierJob;
};

export const isEmbedderReady = () => embedderJob !== null;

/** Batch-embed texts as mean-pooled, L2-normalized vectors. */
export const embedTexts = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) return [];
  const embedder = await getEmbedder();
  const output = await embedder(texts, { pooling: 'mean', normalize: true });
  return output.tolist();
};

/** Embed a single text as a mean-pooled, L2-normalized vector. */
export const embedText = async (text: string): Promise<number[]> => {
  const [vector] = await embedTexts([text]);
  return vector;
};

/** Vectors are L2-normalized, so cosine similarity reduces to a dot product. */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < length; i += 1) sum += a[i] * b[i];
  return sum;
};

/**
 * Rank texts against a query by embedding similarity.
 * Returns scores aligned with the input order, highest similarity first when
 * sorted by the caller.
 */
export const rankBySimilarity = async (query: string, texts: string[]): Promise<number[]> => {
  const queryVector = await embedText(query);
  const docVectors = await embedTexts(texts);
  return docVectors.map((doc) => cosineSimilarity(queryVector, doc));
};
