// Builds live entity records from scraped public sources — no API keys, no
// accounts, no invented data.
//
// The score here is an *evidence coverage* score: how much first-party
// transparency material was actually found in public sources. It says
// nothing about whether the entity is ethical; it says how much of the
// record a reader can verify. Every source that contributed is returned
// alongside the result.

import type { EntityData, SourceRef } from '@/types/entityTypes';
import {
  resolveQuery,
  resolveIndustryLabels,
  type WikidataEntity,
} from './wikidataService';
import {
  fetchWikiSummary,
  fetchWikiControversySections,
  type WikiSummary,
  type WikiSection,
} from './wikipediaService';
import { auditSite, type SiteAudit } from './scrapeService';

export interface BuiltEntity {
  entity: EntityData;
  siteAudit: SiteAudit;
  wiki: WikiSummary | null;
  wikiControversySections: WikiSection[];
}

/** Deterministic 0-100 evidence coverage score with a named breakdown. */
export const evidenceCoverage = (inputs: {
  wiki: WikiSummary | null;
  siteAudit: SiteAudit;
}): number => {
  const { wiki, siteAudit } = inputs;
  let score = 20;
  if (wiki?.extract) score += 20;
  if (siteAudit.reachable > 0) score += 15;
  if (siteAudit.signals.some((s) => s.kind === 'disclosure')) score += 15;
  if (siteAudit.signals.some((s) => s.kind === 'sourcing')) score += 10;
  if (siteAudit.signals.some((s) => s.kind === 'operations')) score += 15;
  if (siteAudit.signals.some((s) => s.kind === 'conflicts' || s.kind === 'controversy_response')) {
    score += 5;
  }
  return Math.min(95, score);
};

const truncate = (text: string, chars: number): string =>
  text.length > chars ? `${text.slice(0, chars).trimEnd()}…` : text;

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** MediaWiki includes the section heading inside the section's text, so a
 *  description would repeat the title rendered right above it. Drop one
 *  leading occurrence of the heading (and any trailing punctuation). */
const stripLeadingHeading = (text: string, heading: string): string => {
  const clean = text.trimStart();
  if (!heading.trim()) return clean;
  return clean.replace(
    new RegExp(`^${escapeRegExp(heading.trim())}\\s*[:.–—-]?\\s*`, 'i'),
    '',
  );
};

/** Compose one EntityData from the scraped record. */
export const buildEntityFromLookup = async (
  wd: WikidataEntity,
): Promise<BuiltEntity> => {
  const [wiki, siteAudit, industries, controversySections] = await Promise.all([
    wd.wikipediaTitle ? fetchWikiSummary(wd.wikipediaTitle) : Promise.resolve(null),
    auditSite(wd.websiteUrl),
    resolveIndustryLabels(wd.industryQids),
    wd.wikipediaTitle
      ? fetchWikiControversySections(wd.wikipediaTitle).catch(() => [])
      : Promise.resolve([]),
  ]);

  const now = new Date().toISOString();
  const sources: SourceRef[] = [
    {
      provider: 'wikidata',
      title: `Wikidata · ${wd.qid}`,
      url: `https://www.wikidata.org/wiki/${wd.qid}`,
      excerpt: wd.description || undefined,
      fetchedAt: now,
    },
  ];
  if (wiki) {
    sources.push({
      provider: 'wikipedia',
      title: `Wikipedia · ${wiki.title}`,
      url: wiki.pageUrl,
      excerpt: truncate(wiki.extract, 220),
      fetchedAt: now,
    });
  }
  siteAudit.pages
    .filter((p) => p.ok)
    .slice(0, 4)
    .forEach((p) =>
      sources.push({
        provider: 'website',
        title: new URL(p.url).host + new URL(p.url).pathname,
        url: p.url,
        fetchedAt: p.fetchedAt,
      }),
    );

  // Signals discovered on the entity's own pages become traceable disclosures.
  const disclosures = siteAudit.signals
    .filter((s) => s.kind === 'disclosure' || s.kind === 'conflicts')
    .slice(0, 4)
    .map((s) => ({
      title: s.label,
      description: `Found on ${s.pageUrl}: ${s.excerpt}`,
      link: s.pageUrl,
    }));

  const controversies = siteAudit.signals
    .filter((s) => s.kind === 'controversy_response')
    .slice(0, 3)
    .map((s) => ({
      title: `${s.label} (context from official site)`,
      description: s.excerpt,
      source_url: s.pageUrl,
    }));
  // Wikipedia's own coverage of disputes is far stronger evidence than
  // keyword matches on the entity's marketing pages. Each entry keeps the
  // URL of the exact section it came from.
  controversySections.forEach((section) =>
    controversies.push({
      title: `${section.heading} — Wikipedia`,
      description: truncate(stripLeadingHeading(section.text, section.heading), 320),
      source_url: section.url,
    }),
  );

  const platformLinks: NonNullable<EntityData['platformLinks']> = [];
  if (wd.youtubeChannelId) {
    platformLinks.push({
      label: 'YouTube (Wikidata)',
      url: `https://www.youtube.com/channel/${wd.youtubeChannelId}`,
    });
  }
  if (wd.xUsername) {
    platformLinks.push({ label: 'X / Twitter (Wikidata)', url: `https://x.com/${wd.xUsername}` });
  }
  platformLinks.forEach((p) =>
    sources.push({ provider: 'platform', title: p.label, url: p.url }),
  );

  // Evidence text: Wikipedia extract and controversy sections plus the
  // readable site pages, capped so the on-device NLI model gets a focused
  // premise.
  const siteEvidence = siteAudit.pages
    .filter((p) => p.ok && p.text)
    .map((p) => p.text!.slice(0, 6000))
    .join('\n');
  const evidenceText = truncate(
    [
      wiki?.extract,
      ...controversySections.map((s) => `${s.heading}: ${s.text}`),
      siteEvidence,
    ]
      .filter(Boolean)
      .join('\n\n'),
    9000,
  );

  const entity: EntityData = {
    id: wd.qid,
    name: wd.label,
    type: wd.isHuman ? 'creator' : 'company',
    description: wd.description || wiki?.extract || 'No description found in public sources.',
    ethicalScore: evidenceCoverage({ wiki, siteAudit }),
    categories: industries,
    certifications: [],
    disclosures: disclosures.length ? disclosures : undefined,
    controversies: controversies.length ? controversies : undefined,
    website: siteAudit.officialUrl,
    ethical_analysis: evidenceText || undefined,
    sources,
    thumbnailUrl: wiki?.thumbnailUrl,
    platformLinks: platformLinks.length ? platformLinks : undefined,
  };

  return { entity, siteAudit, wiki, wikiControversySections: controversySections };
};

/**
 * Look up real entities for a query. Returns [] when public sources hold
 * nothing for a query — the search flow then reports that honestly.
 */
export const lookupEntities = async (
  query: string,
  options: { maxEntities?: number } = {},
): Promise<BuiltEntity[]> => {
  const wdEntities = await resolveQuery(query, { maxEntities: options.maxEntities ?? 3 });
  return Promise.all(wdEntities.map(buildEntityFromLookup));
};
