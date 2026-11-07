// Carries the audit snapshot from the search results into the detail page.
//
// The full BuiltEntity holds every scraped page's text (tens of kilobytes per
// page), which would blow the sessionStorage quota. The detail page only
// needs the audit's shape — which pages were tried, what happened, what
// signals were found — so we persist a trimmed snapshot instead.

import type { BuiltEntity } from './lookupService';

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
};

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
