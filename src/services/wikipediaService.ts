// Wikipedia REST summaries — CORS-enabled, no key. Gives us a human-readable
// extract and lead image to anchor the evidence pack for an entity.

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
