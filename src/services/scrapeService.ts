// The scraper: reads an entity's own web presence through the free r.jina.ai
// reader (no key) and extracts transparency-relevant evidence.
//
// Every extracted signal keeps the page URL and a short context excerpt, so
// the report can show where each claim of "discloses X" actually comes from.
// Scraped text is capped per page and pages that cannot be read are reported
// as unreachable rather than silently skipped.

export const READER_PREFIX = 'https://r.jina.ai/';

export interface ScrapedPage {
  url: string;
  ok: boolean;
  status?: number;
  text?: string;
  error?: string;
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

/** Read one page through the keyless reader proxy, always bypassing the
 *  reader's cache — stale snapshots can hold ad-tracker probes instead of
 *  the real page content. */
export const readPage = async (url: string): Promise<ScrapedPage> => {
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

    // Reader followed a redirect off-site (ad trackers, login walls): the
    // text would describe the wrong page, so refuse it.
    if (meta.finalUrl) {
      try {
        const finalUrl = new URL(meta.finalUrl);
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
    }

    const text = body.length > MAX_TEXT_CHARS ? body.slice(0, MAX_TEXT_CHARS) : body;
    return { url, ok: text.trim().length > 40, text };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error
        ? (error.name === 'AbortError' ? 'timed out' : error.message)
        : 'read failed',
    };
  }
};

const excerptAround = (text: string, index: number, span = 180): string => {
  const start = Math.max(0, index - span / 2);
  const end = Math.min(text.length, index + span);
  const slice = text.slice(start, end).replace(/\s+/g, ' ').trim();
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

/** Candidate pages worth reading for a transparency audit. */
export const auditUrlCandidates = (officialUrl: string): string[] => {
  const base = officialUrl.replace(/\/$/, '');
  const origin = new URL(base).origin;
  const candidates = [
    base,
    `${base}/about`,
    `${origin}/about`,
    `${base}/disclosure`,
    `${origin}/transparency`,
  ];
  return Array.from(new Set(candidates));
};

/**
 * Audit an entity's official website: read the homepage first, then about /
 * disclosure pages only if the homepage answered. Sequential to be a good
 * citizen of the free reader proxy; stops after two readable pages.
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

  const pages: ScrapedPage[] = [];
  let good = 0;
  for (const candidate of candidates) {
    const page = await readPage(candidate);
    pages.push(page);
    if (page.ok) {
      good += 1;
      if (good >= 2) break;
    }
  }

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
