// Carries the audit snapshot from the search results into the detail page.
//
// The full BuiltEntity holds every scraped page's text (tens of kilobytes per
// page), which would blow the sessionStorage quota. The detail page only
// needs the audit's shape — which pages were tried, what happened, what
// signals were found — so we persist a trimmed snapshot instead.

import type { BuiltEntity } from './lookupService';
import type { EntityData } from '@/types/entityTypes';

export interface EvidenceSnapshot {
  entityId: string;
  reachable: number;
  pages: Array<{
    url: string;
    ok: boolean;
    status?: number;
    error?: string;
    fetchedAt?: string;
  }>;
  signals: Array<{
    kind: string;
    label: string;
    pageUrl: string;
    excerpt: string;
  }>;
}

const KEY = 'lastEvidenceSnapshots';
/** The last live records themselves, so a detail page still opens after a
 *  reload or after a different search replaced `lastSearchResults`. */
const ENTITIES_KEY = 'lastLiveEntities';
const MAX_CACHED_ENTITIES = 12;

export const saveEvidenceSnapshots = (built: BuiltEntity[]): void => {
  try {
    const snapshots: EvidenceSnapshot[] = built.map((b) => ({
      entityId: b.entity.id,
      reachable: b.siteAudit.reachable,
      pages: b.siteAudit.pages.map((p) => ({
        url: p.url,
        ok: p.ok,
        status: p.status,
        error: p.error,
        fetchedAt: p.fetchedAt,
      })),
      signals: b.siteAudit.signals,
    }));
    sessionStorage.setItem(KEY, JSON.stringify(snapshots));
  } catch {
    // Storage full/disabled — the detail page simply shows less; it never
    // invents what it could not keep.
  }

  try {
    const incoming = built.map((b) => b.entity);
    const incomingIds = new Set(incoming.map((e) => String(e.id)));
    const previous = loadCachedEntities().filter((e) => !incomingIds.has(String(e.id)));
    const merged = [...incoming, ...previous].slice(0, MAX_CACHED_ENTITIES);
    sessionStorage.setItem(ENTITIES_KEY, JSON.stringify(merged));
  } catch {
    // Same as above: the search results remain the source of truth.
  }
};

const loadCachedEntities = (): EntityData[] => {
  try {
    const raw = sessionStorage.getItem(ENTITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EntityData[]) : [];
  } catch {
    return [];
  }
};

/** A live record seen in an earlier search on this tab, if still cached. */
export const loadCachedEntity = (id: string): EntityData | null =>
  loadCachedEntities().find((e) => String(e.id) === String(id)) ?? null;

export const loadEvidenceSnapshot = (id: string): EvidenceSnapshot | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const snapshots = JSON.parse(raw) as EvidenceSnapshot[];
    return snapshots.find((s) => String(s.entityId) === String(id)) ?? null;
  } catch {
    return null;
  }
};
