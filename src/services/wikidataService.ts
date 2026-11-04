// Free, keyless resolution of a search query to real-world entities.
//
// Wikidata's API is CORS-enabled with origin=* and needs no account. We use
// it for identity (company vs human), the official website, public platform
// handles, industry, and the English Wikipedia sitelink that feeds the
// summary lookup.

export interface WikidataEntity {
  qid: string;
  label: string;
  description: string;
  isHuman: boolean;
  websiteUrl?: string;
  youtubeChannelId?: string;
  xUsername?: string;
  industryQids: string[];
  wikipediaTitle?: string;
  /** Raw instance-of values, used to reject taxa / regions / disambiguation. */
  instanceOfQids: string[];
  badClasses?: string[];
}

const API = 'https://www.wikidata.org/w/api.php';

const searchUrl = (query: string, limit: number) =>
  `${API}?action=wbsearchentities&format=json&origin=*&language=en&uselang=en&limit=${limit}&search=${encodeURIComponent(query)}`;

interface SearchHit {
  id: string;
  label?: string;
  description?: string;
}

export const searchWikidata = async (query: string, limit = 6): Promise<SearchHit[]> => {
  const response = await fetch(searchUrl(query, limit));
  if (!response.ok) throw new Error(`Wikidata search failed: ${response.status}`);
  const data = await response.json();
  return (data.search ?? []).filter((hit: SearchHit) => hit.label);
};

interface EntityClaims {
  claims: Record<string, Array<{ mainsnak: { datavalue?: { value: unknown } } }>>;
  'claims-existent'?  : never;
  sitelinks?: Record<string, { title: string }>;
}

/** Wikidata item links arrive as objects ({ id: 'Q5', ... }); URLs arrive as
 *  plain strings. Normalize both to the QID/string form. */
const asValueString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
};

const firstString = (claims: EntityClaims['claims'], property: string): string | undefined =>
  asValueString(claims[property]?.[0]?.mainsnak?.datavalue?.value);

const allStrings = (claims: EntityClaims['claims'], property: string): string[] =>
  (claims[property] ?? [])
    .map((c) => asValueString(c.mainsnak?.datavalue?.value))
    .filter((v): v is string => typeof v === 'string');

export const FULL_ENTITY_DATA = 'https://www.wikidata.org/wiki/Special:EntityData/{qid}.json';

/** Load one full entity record (claims + sitelinks) by QID. */
export const fetchWikidataEntity = async (qid: string): Promise<WikidataEntity | null> => {
  const response = await fetch(FULL_ENTITY_DATA.replace('{qid}', qid));
  if (!response.ok) return null;
  const data = await response.json();
  const record = data.entities?.[qid];
  if (!record) return null;

  const claims: EntityClaims['claims'] = record.claims ?? {};
  const descriptions = record.descriptions?.en?.value ?? '';
  const label = record.labels?.en?.value ?? '';

  if (!label) return null;

  const instanceOfQids = allStrings(claims, 'P31');
  const isHuman = instanceOfQids.includes('Q5');
  const badClasses = instanceOfQids.filter((qid) => BAD_CLASSES.has(qid));

  return {
    qid,
    label,
    description: descriptions,
    isHuman,
    websiteUrl: firstString(claims, 'P856'),
    youtubeChannelId: firstString(claims, 'P2397'),
    xUsername: firstString(claims, 'P2002'),
    industryQids: allStrings(claims, 'P452').slice(0, 3),
    wikipediaTitle: record.sitelinks?.enwiki?.title,
    instanceOfQids,
    badClasses: badClasses.length ? badClasses : undefined,
  };
};

/** Resolve labels for industry QIDs in one batched call. */
export const resolveIndustryLabels = async (qids: string[]): Promise<string[]> => {
  if (qids.length === 0) return [];
  const url = `${API}?action=wbgetentities&format=json&origin=*&props=labels&languages=en&ids=${qids.join('|')}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return qids
    .map((qid) => data.entities?.[qid]?.labels?.en?.value)
    .filter((v): v is string => typeof v === 'string');
};

/**
 * Resolve a query through Wikidata, picking entities that plausibly are real
 * organizations or people rather than taxa, regions or disambiguation pages.
 *
 * Selection is transparent ranking rather than hard classification:
 *   +2 has an official website (P856)         — organizations and public figures have these
 *   +2 is a human (P31 includes Q5)           — a creator or public person
 *   +1 label matches the query exactly
 *   +1 has an English Wikipedia sitelink
 *   -10 instance of a taxon / genus / region / disambiguation page
 * Entities below 0 are dropped; the rest are returned in rank order.
 */
const BAD_CLASSES = new Set([
  'Q16521', // taxon
  'Q756', // taxon (newer)
  'Q414', // species
  'Q2354279', // species (unnamed rank origin)
  'Q56061', // administrative territorial entity
  'Q82794', // geographic location
  'Q515', // city
  'Q15127012', // civil township
  'Q486972', // human settlement
  'Q3957244', // town in the United States
  'Q4167410', // disambiguation page
  'Q13406463', // Wikimedia list article
  'Q11266489', // Wikimedia split page
  'Q95074', // theatrical film
  'Q7889', // video game
  'Q7725310', // fictional entity
  'Q215627', // fictional person
]);

const rankHit = (entity: WikidataEntity, query: string): number => {
  let score = 0;
  if (entity.websiteUrl) score += 2;
  if (entity.isHuman) score += 2;
  const labelLower = entity.label.toLowerCase();
  const queryLower = query.toLowerCase();
  if (labelLower === queryLower) score += 2;
  else if (labelLower.startsWith(queryLower)) score += 1.5;
  if (entity.wikipediaTitle) score += 1;

  // Salience tokens in the description: what kind of thing is this?
  const desc = entity.description.toLowerCase();
  if (/\b(company|brand|corporation|organization|label|studio|record|youtuber|influencer|creator|musician|artist|founder|activist|writer|journalist|entrepreneur|designer)\b/.test(desc)) {
    score += 1.5;
  }
  if (/\b(genus|species|family|subfamily|town|city|municipality|village|settlement|county|region|province|state|district|river|mountain|valley|island|film|movie|television series|album|song|audio track\b|track|ship|vessel|tanker)\b/.test(desc)) {
    score -= 4;
  }
  if (entity.badClasses?.length) score -= 10;
  return score;
};

export const resolveQuery = async (
  query: string,
  options: { maxEntities?: number } = {},
): Promise<WikidataEntity[]> => {
  const hits = await searchWikidata(query, 8);
  const loaded = await Promise.all(
    hits.map(async (hit) => {
      const entity = await fetchWikidataEntity(hit.id).catch(() => null);
      if (!entity || !entity.description) return null;
      return { entity, rank: rankHit(entity, query) };
    }),
  );

  const max = options.maxEntities ?? 3;
  return loaded
    .filter((entry): entry is { entity: WikidataEntity; rank: number } => entry !== null)
    .filter((entry) => entry.rank >= 2.5)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, max)
    .map((entry) => entry.entity);
};
