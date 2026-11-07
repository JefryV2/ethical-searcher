// Splits a live record's evidence into citable passages.
//
// The detail page and the on-device models both need text at a finer grain
// than "one big blob per record": retrieval, source-independence checks and
// the rule-vs-model comparison all work on passages. Each passage keeps the
// exact page (and section) it came from, so every model output can be traced
// back to a link.

import type { BuiltEntity } from './lookupService';

export interface EvidencePassage {
  id: string;
  text: string;
  /** The page or section this passage was read from. */
  url: string;
  /** Human label for the source, e.g. "Wikipedia · Labor issues". */
  title: string;
  provider: 'wikipedia' | 'website' | 'wikidata' | 'platform';
  kind: 'summary' | 'section' | 'page' | 'signal';
}

const MIN_CHARS = 80;
const MAX_PASSAGES = 48;

/** Strip Markdown link/image syntax and bare URLs. The URL is kept on the
 *  passage itself, so the text only needs its visible words. */
const stripMarkdown = (text: string): string =>
  text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\bwww\.\S+/g, ' ')
    .replace(/#{1,6}\s+/g, ' ');

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** MediaWiki includes the section heading at the start of the section text, so
 *  prefixing the heading again would repeat it. Drop one leading occurrence. */
const stripLeadingHeading = (text: string, heading: string): string => {
  const clean = text.trimStart();
  if (!heading.trim()) return clean;
  return clean.replace(
    new RegExp(`^${escapeRegExp(heading.trim())}\\s*[:.–—-]?\\s*`, 'i'),
    '',
  );
};

/** Navigation menus, cookie banners and serialized data survive HTML-to-text
 *  conversion as punctuation soup. They are useless to a reader and toxic to
 *  retrieval, so they are dropped before chunking. */
const looksLikeProse = (text: string): boolean => {
  if (text.length < MIN_CHARS) return false;
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  if (letters / text.length < 0.6) return false;
  if ((text.match(/https?:\/\//g) ?? []).length > 1) return false;
  if ((text.match(/\]\(/g) ?? []).length > 1) return false;
  if (text.includes('{"') || text.includes('version":')) return false;
  // Menu/nav fragments survive HTML-to-text conversion as "A + B + C" chains.
  if ((text.match(/ \+ /g) ?? []).length >= 3) return false;
  if ((text.match(/\s\|\s/g) ?? []).length >= 3) return false;
  // Markdown bullet lists from site navigation: "* About * Activism * ...".
  if ((text.match(/\s\*\s/g) ?? []).length >= 3) return false;
  if ((text.match(/(?:^|\s)#{2,6}\s/g) ?? []).length >= 2) return false;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 12) return false;
  const sentences = (text.match(/[.!?](\s|$)/g) ?? []).length;
  if (sentences < 1 && text.length > 180) return false;
  return true;
};

/** Cut text into sentence-aligned chunks of roughly `maxChars`, never
 *  exceeding `maxChunks`. Very long sentences are hard-split so a single
 *  unpunctuated paragraph cannot stall the chunker. */
export const chunkText = (text: string, maxChars = 420, maxChunks = 8): string[] => {
  const clean = stripMarkdown(text).replace(/\s+/g, ' ').trim();
  if (clean.length < MIN_CHARS) return [];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  const flush = () => {
    if (current && chunks.length < maxChunks) chunks.push(current);
    current = '';
  };

  for (const sentence of sentences) {
    if (!sentence) continue;
    if (sentence.length > maxChars) {
      flush();
      for (let i = 0; i < sentence.length && chunks.length < maxChunks; i += maxChars) {
        chunks.push(sentence.slice(i, i + maxChars).trim());
      }
      continue;
    }
    if (current && current.length + sentence.length + 1 > maxChars) flush();
    current = current ? `${current} ${sentence}` : sentence;
    if (chunks.length >= maxChunks) break;
  }
  flush();

  return chunks.filter((chunk) => looksLikeProse(chunk)).slice(0, maxChunks);
};

const pageTitle = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
};

const dedupeKey = (text: string): string =>
  text.slice(0, 120).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Build the passage set for one live record, capped so sessionStorage stays
 *  small (≈20 KB per entity). */
export const buildPassages = (built: BuiltEntity): EvidencePassage[] => {
  const { entity, wiki, siteAudit, wikiControversySections } = built;
  const passages: EvidencePassage[] = [];
  let seq = 0;

  const add = (
    chunks: string[],
    meta: Omit<EvidencePassage, 'id' | 'text'>,
  ) => {
    for (const text of chunks) {
      passages.push({ id: `${entity.id}-${seq++}`, text, ...meta });
    }
  };

  if (wiki?.extract) {
    add(chunkText(wiki.extract, 420, 4), {
      url: wiki.pageUrl,
      title: `Wikipedia · ${wiki.title}`,
      provider: 'wikipedia',
      kind: 'summary',
    });
  }

  for (const section of wikiControversySections) {
    const body = stripLeadingHeading(section.text, section.heading);
    add(chunkText(`${section.heading}. ${body}`, 420, 3), {
      url: section.url,
      title: `Wikipedia · ${section.heading}`,
      provider: 'wikipedia',
      kind: 'section',
    });
  }

  for (const page of siteAudit.pages) {
    if (!page.ok || !page.text) continue;
    add(chunkText(page.text.slice(0, 12000), 420, 6), {
      url: page.url,
      title: pageTitle(page.url),
      provider: 'website',
      kind: 'page',
    });
  }

  for (const signal of siteAudit.signals) {
    if (signal.excerpt.length < MIN_CHARS) continue;
    add([signal.excerpt], {
      url: signal.pageUrl,
      title: `${signal.label} · ${pageTitle(signal.pageUrl)}`,
      provider: 'website',
      kind: 'signal',
    });
  }

  const seen = new Set<string>();
  const unique = passages.filter((passage) => {
    const key = dedupeKey(passage.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, MAX_PASSAGES);
};
