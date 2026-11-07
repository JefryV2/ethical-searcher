// Wikipedia REST summaries — CORS-enabled, no key. Gives us a human-readable
// extract and lead image to anchor the evidence pack for an entity.
//
// The same service also pulls the article's controversy/criticism/reception
// sections through the MediaWiki action API (also CORS + keyless): real
// disputes with section-level URL provenance, instead of word-matching on
// the entity's own marketing pages.

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnailUrl?: string;
  pageUrl: string;
}

export const fetchWikiSummary = async (title: string): Promise<WikiSummary | null> => {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();

  if (data.type === 'disambiguation') return null;

  return {
    title: data.title ?? title,
    extract: data.extract ?? '',
    thumbnailUrl: data.thumbnail?.source,
    pageUrl: data.content_urls?.desktop?.page
      ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
};

export interface WikiSection {
  heading: string;
  text: string;
  /** URL of the specific section on the article — the provenance pointer. */
  url: string;
}

/* Many articles don't use a single "Controversies" heading: Nike folds its
   disputes into "Environmental record", Nestlé into "Controversies and
   criticism", creators into "Reception". So we match a curated range of
   issue headings — narrowly, so routine press sections aren't flagged — and
   child sections inherit their parent's relevance ("Toxic chemicals" under
   "Environmental record" is part of the issue record; "Notes" is not). */
const STRONG_ISSUE = /\b(controvers|criticism|scandal|lawsuit|litigation|legal (issues|action)|backlash|boycott)\b/i;
const WEAK_ISSUE = /\b(labor|sweatshop|human rights|environmental record|protests?|reception)\b/i;
const API = 'https://en.wikipedia.org/w/api.php';

interface WikiSectionInfo {
  index: number;
  line: string;
  anchor: string;
  toclevel: number;
}

/** Which fetched section indexes carry issue coverage. Children inherit a
 *  matched parent's relevance; strong matches are preferred over weak ones. */
const pickIssueSections = (sections: WikiSectionInfo[], limit = 3): WikiSectionInfo[] => {
  // Nearest ancestor above each section (the walk is by table-of-contents
  // level: level 2 is a chapter, level 3 lives inside one, like subsections).
  const stack: WikiSectionInfo[] = [];
  const parentOf = new Map<WikiSectionInfo, WikiSectionInfo | null>();
  for (const section of sections) {
    while (stack.length && stack[stack.length - 1].toclevel >= section.toclevel) stack.pop();
    parentOf.set(section, stack.length ? stack[stack.length - 1] : null);
    stack.push(section);
  }

  const matches = (line: string) => STRONG_ISSUE.test(line) || WEAK_ISSUE.test(line);
  const strongOwn: WikiSectionInfo[] = [];
  const weakOwn: WikiSectionInfo[] = [];
  const inherited: WikiSectionInfo[] = [];
  for (const section of sections) {
    if (!Number.isInteger(section.index) || section.index <= 0) continue;
    if (STRONG_ISSUE.test(section.line)) strongOwn.push(section);
    else if (WEAK_ISSUE.test(section.line)) weakOwn.push(section);
    else {
      // Child of a matched heading inherits its relevance (e.g. "Toxic
      // chemicals" inside "Environmental record"); an orphan child does not.
      let parent = parentOf.get(section) ?? null;
      while (parent) {
        if (matches(parent.line)) {
          inherited.push(section);
          break;
        }
        parent = parentOf.get(parent) ?? null;
      }
    }
  }

  const inOrder = (a: WikiSectionInfo, b: WikiSectionInfo) => a.index - b.index;
  strongOwn.sort(inOrder);
  weakOwn.sort(inOrder);
  inherited.sort(inOrder);
  return [...strongOwn, ...weakOwn, ...inherited].slice(0, limit);
};

const apiFetch = async (params: Record<string, string>): Promise<any | null> => {
  const search = new URLSearchParams({ format: 'json', origin: '*', redirects: '1', ...params });
  const response = await fetch(`${API}?${search}`);
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/** Turn rendered section HTML into clean plain text (drop scripts, styles,
 *  reference lists and tables — keep the prose). */
const htmlToText = (html: string): string => {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll(
    'script, style, table, .reflist, .references, .mw-references-wrap, .mw-cite-backlink, .navbox, .metadata, sup, .mw-editsection, .hatnote, .thumb, figure',
  ).forEach((el) => el.remove());
  const text = doc.body?.textContent ?? '';
  return text
    .replace(/\s+\^\s+/g, ' ') // leftover citation backlink carets
    .replace(/^\^\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Fetch the issue-flavoured sections of a Wikipedia article, with a direct
 * URL to each section. Returns [] when the article has none — the caller
 * reports that honestly rather than inventing issues.
 */
export const fetchWikiControversySections = async (title: string): Promise<WikiSection[]> => {
  const parsed = await apiFetch({ action: 'parse', page: title, prop: 'sections' });
  const sections: WikiSectionInfo[] = (parsed?.parse?.sections ?? []).map((s: any) => ({
    index: Number(s.index),
    line: String(s.line ?? ''),
    anchor: String(s.anchor ?? ''),
    toclevel: Number(s.toclevel ?? 0),
  }));
  const matched = pickIssueSections(sections);
  if (matched.length === 0) return [];

  const fetched = await Promise.all(
    matched.map(async (section) => {
      const sectionData = await apiFetch({
        action: 'parse',
        page: title,
        prop: 'text',
        section: String(section.index),
      });
      const html = sectionData?.parse?.text?.['*'] ?? '';
      const text = htmlToText(html);
      if (text.length < 80) return null; // stub/empty section — not evidence
      return {
        heading: section.line,
        text: text.slice(0, 2500),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}#${section.anchor}`,
      } satisfies WikiSection;
    }),
  );
  return fetched.filter((s): s is WikiSection => s !== null);
};
