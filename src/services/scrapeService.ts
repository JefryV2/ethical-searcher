// The scraper: reads an entity's own web presence and extracts
// transparency-relevant evidence.
//
// Two keyless backends, tried in order:
//   1. The local Scrapling microservice (scrape-api/, HTTP fetcher with
//      browser TLS impersonation). Preferred because it fetches the real
//      site directly, has no rate limits from our perspective, and reports
//      the true final URL after redirects.
//   2. The free r.jina.ai reader proxy — used when the microservice is not
//      running (e.g., a deployed static build) or fails on this page.
//
// Every extracted signal keeps the page URL and a short context excerpt, so
// the report can show where each claim of "discloses X" actually comes from.
// Scraped text is capped per page and pages that cannot be read are reported
// as unreachable rather than silently skipped.

export const READER_PREFIX = 'https://r.jina.ai/';

/** Base URL of the optional local Scrapling service (scrape-api/). */
export const LOCAL_READER =
  localStorage.getItem('scraperUrl') ?? 'http://127.0.0.1:8022';

export interface ScrapedPage {
  url: string;
  ok: boolean;
  status?: number;
  text?: string;
  error?: string;
  /** ISO timestamp of the fetch — shown to the user as "last checked". */
  fetchedAt?: string;
}

export interface TransparencySignal {
  kind: 'disclosure' | 'sourcing' | 'operations' | 'controversy_response' | 'conflicts';
  label: string;
  pageUrl: string;
  excerpt: string;
}

export interface SiteAudit {
  officialUrl?: string;
  pages: ScrapedPage[];
  signals: TransparencySignal[];
  reachable: number;
}

const fetchTimeout = (url: string, ms = 15000, headers?: Record<string, string>) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal, headers }).finally(() => clearTimeout(timer));
};

const MAX_TEXT_CHARS = 24_000;

interface ReaderMetadata {
  finalUrl?: string;
  title?: string;
}

/**
 * The reader prefixes each page with a small metadata block
 *   Title: ... / URL Source: ... / Final URL: ...
 * followed by "Markdown Content:". Split it off so only real content
 * reaches the models, and check the final URL for tracker redirects.
 */
const splitReaderPreamble = (text: string): { body: string; meta: ReaderMetadata } => {
  const marker = 'Markdown Content:';
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return { body: text, meta: {} };

  const preamble = text.slice(0, markerIndex);
  const body = text.slice(markerIndex + marker.length).trim();
  const finalMatch = preamble.match(/Final URL:\s*(\S+)/);
  return { body, meta: { finalUrl: finalMatch?.[1] } };
};

const sameHost = (a: URL, b: URL): boolean => {
  const normalize = (host: string) => host.replace(/^www\./i, '').toLowerCase();
  return normalize(a.host) === normalize(b.host);
};

const refuseCrossHost = (url: string, finalUrlValue?: string | null): ScrapedPage | null => {
  if (!finalUrlValue) return null;
  try {
    const finalUrl = new URL(finalUrlValue);
    const requested = new URL(url);
    if (finalUrl.protocol.startsWith('http') && !sameHost(finalUrl, requested)) {
      return {
        url,
        ok: false,
        error: `redirected to a different host (${finalUrl.host}); text discarded to avoid reading the wrong page`,
      };
    }
  } catch {
    // Unparseable final URL — keep the content, it usually means no metadata.
  }
  return null;
};

let localProbe: Promise<boolean> | null = null;
const localAvailable = (): Promise<boolean> => {
  localProbe ??= fetchTimeout(`${LOCAL_READER}/health`, 2500)
    .then((r) => r.ok)
    .catch(() => false);
  return localProbe;
};

/** Epoch seconds from the microservice become an ISO stamp; undefined stays
 *  undefined so the caller can fall back to its own timestamp. */
const fromEpoch = (seconds?: number | null): string | undefined =>
  typeof seconds === 'number' && seconds > 0
    ? new Date(seconds * 1000).toISOString()
    : undefined;

/** Read one page through the local Scrapling microservice. */
const readViaLocal = async (url: string): Promise<ScrapedPage> => {
  const response = await fetchTimeout(
    `${LOCAL_READER}/read?url=${encodeURIComponent(url)}`,
    20000,
  );
  if (!response.ok) {
    return { url, ok: false, status: response.status, error: `HTTP ${response.status}` };
  }
  const data = await response.json() as {
    ok: boolean;
    final_url?: string | null;
    text?: string | null;
    error?: string | null;
    status?: number | null;
    fetched_at?: number | null;
  };
  if (!data.ok) {
    return {
      url,
      ok: false,
      status: data.status ?? undefined,
      error: data.error ?? 'local scraper reported failure',
      fetchedAt: fromEpoch(data.fetched_at),
    };
  }
  const text = (data.text ?? '').slice(0, MAX_TEXT_CHARS);
  return (
    refuseCrossHost(url, data.final_url ?? undefined) ?? {
      url,
      ok: text.trim().length > 40,
      status: data.status ?? undefined,
      text,
      fetchedAt: fromEpoch(data.fetched_at) ?? new Date().toISOString(),
    }
  );
};

/** Read several pages of one site in one round-trip through the local
 *  microservice, which fetches them in parallel threads. The server caps
 *  the batch and refuses URLs from other hosts, so this can never be
 *  abused as a general crawler. */
const crawlViaLocal = async (urls: string[]): Promise<ScrapedPage[]> => {
  const response = await fetchTimeout(
    `${LOCAL_READER}/crawl?urls=${encodeURIComponent(urls.join(','))}`,
    45000,
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json() as {
    results?: Array<{
      url: string;
      ok: boolean;
      final_url?: string | null;
      text?: string | null;
      error?: string | null;
      status?: number | null;
      fetched_at?: number | null;
    }>;
  };
  const results = data.results ?? [];
  return urls.map((url) => {
    const result = results.find((r) => r.url === url);
    if (!result) {
      return { url, ok: false, error: 'not returned by the crawl service' as const };
    }
    const stamp = fromEpoch(result.fetched_at);
    if (!result.ok) {
      return {
        url,
        ok: false,
        status: result.status ?? undefined,
        error: result.error ?? 'local scraper reported failure',
        fetchedAt: stamp,
      };
    }
    const text = (result.text ?? '').slice(0, MAX_TEXT_CHARS);
    return (
      refuseCrossHost(url, result.final_url ?? undefined) ?? {
        url,
        ok: text.trim().length > 40,
        status: result.status ?? undefined,
        text,
        fetchedAt: stamp ?? new Date().toISOString(),
      }
    );
  });
};

/** Read one page: local Scrapling service when running, otherwise the
 *  free r.jina.ai reader. Both paths refuse cross-host redirects, so a page
 *  that bounced through an ad tracker is never treated as the entity's site. */
export const readPage = async (url: string): Promise<ScrapedPage> => {
  if (await localAvailable()) {
    try {
      return await readViaLocal(url);
    } catch {
      // Service died between the health check and this call — fall through
      // to the public reader and re-probe on the next page.
      localProbe = null;
    }
  }
  return readViaJina(url);
};

/** Read one page through the keyless reader proxy, always bypassing the
 *  reader's cache — stale snapshots can hold ad-tracker probes instead of
 *  the real page content. */
const readViaJina = async (url: string): Promise<ScrapedPage> => {
  try {
    const response = await fetchTimeout(
      READER_PREFIX + url,
      15000,
      { 'x-no-cache': 'true' },
    );
    if (!response.ok) {
      return { url, ok: false, status: response.status, error: `HTTP ${response.status}` };
    }
    const raw = await response.text();
    const { body, meta } = splitReaderPreamble(raw);
    const text = body.length > MAX_TEXT_CHARS ? body.slice(0, MAX_TEXT_CHARS) : body;
    return (
      refuseCrossHost(url, meta.finalUrl) ?? {
        url,
        ok: text.trim().length > 40,
        status: response.status,
        text,
        fetchedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error
        ? (error.name === 'AbortError' ? 'timed out' : error.message)
        : 'read failed',
      fetchedAt: new Date().toISOString(),
    };
  }
};

/** Pages arrive as Markdown (r.jina.ai) or plain text. Excerpts are shown as
 *  sentences beside their source link, so link/image syntax and emphasis
 *  markers would read as noise — reduce them to their visible text. */
const cleanExcerpt = (text: string): string =>
  text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images → nothing
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their label
    .replace(/!\[[^\]]*\]\([^)]*$/g, ' ') // image cut off by the slice
    .replace(/\[([^\]]*)\]\([^)]*$/g, '$1') // link cut off by the slice
    .replace(/\[[^\]]*\]\[[^\]]*\]/g, ' ') // reference-style links
    .replace(/<\/?[a-z][^>]*>/gi, ' ') // stray HTML tags
    .replace(/[*_`#>]+/g, ' ') // emphasis / heading / quote marks
    .replace(/[ \t]+/g, ' ')
    .trim();

const excerptAround = (text: string, index: number, span = 180): string => {
  const start = Math.max(0, index - span / 2);
  const end = Math.min(text.length, index + span);
  const slice = cleanExcerpt(text.slice(start, end)).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + slice + (end < text.length ? '…' : '');
};

interface SignalPattern {
  kind: TransparencySignal['kind'];
  label: string;
  regex: RegExp;
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    kind: 'disclosure',
    label: 'Discloses sponsorships / paid partnerships',
    regex: /disclos\w+|paid partnership|sponsori\w+|#ad\b|advertorials?/i,
  },
  {
    kind: 'sourcing',
    label: 'Cites sources for claims',
    regex: /\bsources?\b|\bcitations?\b|\breferences?\b|\bmethodology\b/i,
  },
  {
    kind: 'operations',
    label: 'Publishes reports / operational information',
    regex: /impact report|annual report|transparency report|audited|sustainability report/i,
  },
  {
    kind: 'controversy_response',
    label: 'Addresses issues / corrections',
    regex: /correct\w+|retract\w+|apolog\w+|settlement|investigation/i,
  },
  {
    kind: 'conflicts',
    label: 'Discloses funding / conflicts of interest',
    regex: /conflict[s]? of interest|\bfunded by\b|\binvestor relations?\b|funding partners?/i,
  },
];

const scanPage = (page: ScrapedPage): TransparencySignal[] => {
  if (!page.ok || !page.text) return [];
  const signals: TransparencySignal[] = [];
  for (const pattern of SIGNAL_PATTERNS) {
    const match = page.text.match(pattern.regex);
    if (match && match.index !== undefined) {
      signals.push({
        kind: pattern.kind,
        label: pattern.label,
        pageUrl: page.url,
        excerpt: excerptAround(page.text, match.index),
      });
    }
  }
  return signals;
};

/** Candidate pages worth reading for a transparency audit: the landing page
 *  plus the disclosure-ish paths companies and creators actually use. */
export const auditUrlCandidates = (officialUrl: string): string[] => {
  const base = officialUrl.replace(/\/$/, '');
  const origin = new URL(base).origin;
  const candidates = [
    base,
    `${base}/about`,
    `${origin}/about`,
    `${base}/sustainability`,
    `${origin}/sustainability`,
    `${base}/ethics`,
    `${base}/transparency`,
    `${origin}/transparency`,
    `${base}/press`,
    `${base}/disclosure`,
  ];
  return Array.from(new Set(candidates));
};

/** Fallback audit path: read pages one at a time through whichever reader is
 *  available. Keeps the free proxy path polite (sequential, capped) while the
 *  local service does the deep parallel crawl. */
const sequentialAudit = async (candidates: string[], maxAttempts: number): Promise<ScrapedPage[]> => {
  const pages: ScrapedPage[] = [];
  let good = 0;
  for (const candidate of candidates.slice(0, maxAttempts)) {
    const page = await readPage(candidate);
    pages.push(page);
    if (page.ok) {
      good += 1;
      if (good >= 3) break;
    }
  }
  return pages;
};

/**
 * Audit an entity's official website. With the local Scrapling service
 * running, up to eight candidate pages (home, about, sustainability, ethics,
 * transparency, press…) are fetched in parallel in one round-trip. Without
 * it, the fallback reads a few pages sequentially through the free reader and
 * says less — honestly.
 */
export const auditSite = async (officialUrl?: string): Promise<SiteAudit> => {
  if (!officialUrl) {
    return { pages: [], signals: [], reachable: 0 };
  }

  let cleanUrl = officialUrl;
  if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
  // The Wikidata value may be a bare origin; guard against malformed values.
  let candidates: string[];
  try {
    candidates = auditUrlCandidates(cleanUrl);
  } catch {
    return { officialUrl: cleanUrl, pages: [], signals: [], reachable: 0 };
  }

  let pages: ScrapedPage[];
  if (await localAvailable()) {
    try {
      pages = await crawlViaLocal(candidates.slice(0, 8));
    } catch {
      // Service died between the health check and the crawl — fall back and
      // re-probe on the next audit.
      localProbe = null;
      pages = await sequentialAudit(candidates, 6);
    }
  } else {
    pages = await sequentialAudit(candidates, 6);
  }

  const good = pages.filter((p) => p.ok).length;
  const seenKinds = new Set<string>();
  const signals = pages
    .flatMap(scanPage)
    .filter((signal) => {
      if (seenKinds.has(signal.kind)) return false;
      seenKinds.add(signal.kind);
      return true;
    });

  return { officialUrl: cleanUrl, pages, signals, reachable: good };
};
