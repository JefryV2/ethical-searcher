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

import { pipeline, AutoTokenizer, env } from '@huggingface/transformers';

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

// Download progress plumbing: the first run can take tens of seconds on a
// slow connection, so UI elements subscribe here instead of guessing.
export interface ModelProgress {
  task: 'embeddings' | 'zero-shot';
  file: string;
  status: 'pending' | 'progress' | 'done' | 'error';
  /** 0-100 as reported by the pipeline; -1 when unknown. */
  progress: number;
}

const progressListeners = new Set<{ loadId: number; cb: (p: ModelProgress) => void }>();
let loadSeq = 0;
let activeLoad: { loadId: number; task: string; file: string; status: string; progress: number } | null = null;

export const subscribeModelProgress = (cb: (p: ModelProgress) => void): (() => void) => {
  const entry = { loadId: loadSeq, cb };
  loadSeq += 1;
  progressListeners.add(entry as { loadId: number; cb: (p: ModelProgress) => void });
  if (activeLoad) cb({ ...(activeLoad as unknown as ModelProgress) });
  return () => progressListeners.delete(entry as { loadId: number; cb: (p: ModelProgress) => void });
};

const trackProgress = (task: 'embeddings' | 'zero-shot') => (data: { status?: string; file?: string; progress?: number }) => {
  const status = data.status === 'progress' ? 'progress' : data.status === 'done' ? 'done' : data.status === 'ready' ? 'done' : 'pending';
  activeLoad = {
    loadId: activeLoad?.loadId ?? 0,
    task,
    file: data.file ?? '',
    status,
    progress: typeof data.progress === 'number' ? Math.round(data.progress) : -1,
  };
  progressListeners.forEach(({ cb }) =>
    cb({ task, file: data.file ?? '', status, progress: activeLoad!.progress }),
  );
  if (status === 'done') activeLoad = null;
};

export const getEmbedder = (): Promise<Embedder> => {
  if (!embedderJob) {
    console.log('[ml] loading embedding model:', EMBEDDING_MODEL_ID);
    embedderJob = pipeline('feature-extraction', EMBEDDING_MODEL_ID, {
      progress_callback: trackProgress('embeddings'),
    }) as unknown as Promise<Embedder>;
  }
  return embedderJob;
};

export const getZeroShotClassifier = (): Promise<ZeroShotClassifier> => {
  if (!classifierJob) {
    console.log('[ml] loading NLI model:', NLI_MODEL_ID);
    classifierJob = pipeline('zero-shot-classification', NLI_MODEL_ID, {
      progress_callback: trackProgress('zero-shot'),
    }) as unknown as Promise<ZeroShotClassifier>;
  }
  return classifierJob;
};

// The classifier only accepts strings, so the caller that feeds it scraped
// evidence needs the model's own tokenizer to fit text into the 512-token
// context reliably (character counts are not token counts: markdown links
// and URLs tokenize far worse than prose).
type Tokenizer = {
  encode?: (text: string, options?: Record<string, unknown>) => { ids: number[] };
  decode: (ids: number[], options?: Record<string, unknown>) => string;
};

let tokenizerJob: Promise<Tokenizer> | null = null;

export const getNliTokenizer = (): Promise<Tokenizer> => {
  if (!tokenizerJob) {
    tokenizerJob = AutoTokenizer.from_pretrained(NLI_MODEL_ID) as unknown as Promise<Tokenizer>;
  }
  return tokenizerJob;
};

/**
 * Cut text so that its token count fits within `maxTokens` wordpieces,
 * measured with the NLI model's own tokenizer. URLs and markdown link
 * targets are stripped first — they burn tokens without meaning anything to
 * an entailment model.
 */
export const fitToTokenBudget = async (text: string, maxTokens: number): Promise<string> => {
  const tokenizer = await getNliTokenizer();
  const cleaned = text
    .replace(/\(https?:\/\/[^\s)]+\)/g, '')   // markdown link targets
    .replace(/https?:\/\/\S+/g, '');          // bare URLs
  // Depending on transformers.js version, encode() returns a plain number
  // array or an object holding the ids — accept both shapes.
  const encoded = tokenizer.encode!(cleaned, { add_special_tokens: false });
  const ids: ArrayLike<unknown> = Array.isArray(encoded)
    ? encoded
    : ((encoded as { ids?: unknown }).ids as ArrayLike<unknown> ?? []);
  const total = Number(ids.length ?? 0);
  if (total <= maxTokens) return cleaned;
  const clipped = Array.from({ length: maxTokens }, (_, i) => Number(ids[i]));
  return tokenizer.decode(clipped, { skip_special_tokens: true });
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
