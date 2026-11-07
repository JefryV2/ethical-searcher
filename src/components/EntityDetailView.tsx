// The detail view for one entity record.
//
// Lays out the full evidence pack: identity and score at the top,
// audit parameters (pages tried, signals found, timestamps),
// followed by sources, controversies and disclosures with primary links.

import { Card } from '@/components/ui/card';
import { SourcesSection } from '@/components/SourcesSection';
import { SimilarRecords } from '@/components/SimilarRecords';
import type { EntityData } from '@/types/entityTypes';
import type { EvidenceSnapshot } from '@/services/evidenceStore';
import { timeAgo } from '@/services/report';
import type { ReactNode } from 'react';

interface EntityDetailViewProps {
  entity: EntityData;
  evidence?: EvidenceSnapshot | null;
}

const scoreTone = (score: number): string => {
  if (score >= 70) return 'score-good';
  if (score >= 50) return 'score-mid';
  return 'score-low';
};

const SIGNAL_TONE: Record<string, string> = {
  disclosure: 'score-good',
  sourcing: 'score-good',
  operations: 'score-good',
  controversy_response: 'score-mid',
  conflicts: 'score-mid',
};

const lastCheckedOf = (entity: EntityData): string | undefined =>
  (entity.sources ?? [])
    .map((s) => s.fetchedAt)
    .filter((t): t is string => Boolean(t))
    .sort()
    .pop();

const Section = ({
  tag = "::",
  title,
  meta,
  children,
}: {
  tag?: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) => (
  <Card className="dossier-card p-5 space-y-3 font-mono">
    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
      <span className="text-primary font-bold text-xs select-none">{tag}</span>
      <h2 className="font-mono text-sm font-bold text-foreground tracking-tight">{title}</h2>
      {meta && <span className="ml-auto font-mono text-[11px] text-muted-foreground">{meta}</span>}
    </div>
    {children}
  </Card>
);

export const EntityDetailView = ({ entity, evidence }: EntityDetailViewProps) => {
  const displayScore = entity.ethicalScore > 10 ? entity.ethicalScore : entity.ethicalScore * 10;
  const tone = scoreTone(displayScore);
  const isLive = Boolean(entity.sources?.length);
  const lastChecked = lastCheckedOf(entity);
  const pagesTried = evidence?.pages.length ?? 0;
  const reachable = evidence?.reachable ?? 0;
  const signals = evidence?.signals ?? [];
  const categories = entity.categories ?? [];

  return (
    <div className="space-y-6 font-mono">
      {/* ---------------------------------------------------------------- */}
      {/* Identity + score dossier masthead                                */}
      {/* ---------------------------------------------------------------- */}
      <Card className="dossier-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {entity.thumbnailUrl ? (
            <img
              src={entity.thumbnailUrl}
              alt=""
              className="w-14 h-14 border border-border object-cover shrink-0 mt-1 grayscale contrast-125"
            />
          ) : (
            <div className="w-14 h-14 bg-secondary/60 border border-border flex items-center justify-center shrink-0 mt-1 text-primary font-bold text-lg select-none">
              {entity.type === 'company' ? '§' : '@'}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="font-bold text-primary">
                [{entity.type === 'company' ? 'CORP' : 'CREATOR'}]
              </span>
              {entity.id && /^Q\d+$/.test(entity.id) && (
                <>
                  <span className="text-border">·</span>
                  <a
                    href={`https://www.wikidata.org/wiki/${entity.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    wikidata:{entity.id}
                    <span className="text-primary text-[10px]">↗</span>
                  </a>
                </>
              )}
              {!isLive && <span className="text-muted-foreground/60">[sample record]</span>}
            </div>

            <h1 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {entity.name}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-mono">
              {entity.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 font-mono text-xs">
              {isLive && entity.website && (
                <a
                  href={entity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span className="text-muted-foreground">www:</span>
                  {entity.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <span className="text-primary text-[10px]">↗</span>
                </a>
              )}
              {isLive && entity.platformLinks?.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  <span>↳</span>
                  {p.label.replace(' (Wikidata)', '')}
                </a>
              ))}
            </div>
          </div>

          <div className="md:text-right shrink-0 md:pl-6 md:border-l md:border-border space-y-1">
            <p className="text-[11px] text-muted-foreground">EVIDENCE COVERAGE</p>
            <p className={`text-3xl font-bold font-mono ${tone}`}>
              {displayScore}
              <span className="text-sm text-muted-foreground font-normal ml-1">/100</span>
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[26ch] md:ml-auto leading-relaxed">
              {isLive
                ? 'Volume of verifiable primary sources discovered in public records.'
                : 'Sample catalog record score for illustration.'}
            </p>
          </div>
        </div>

        {isLive && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-none overflow-hidden mt-6 border border-border font-mono text-xs">
            <div className="bg-card p-3">
              <p className="text-[10px] text-muted-foreground">&gt; SOURCES</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{entity.sources?.length ?? 0}</p>
            </div>
            <div className="bg-card p-3">
              <p className="text-[10px] text-muted-foreground">&gt; PAGES CRAWLED</p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {reachable}
                {pagesTried > 0 && (
                  <span className="text-[11px] text-muted-foreground font-normal ml-1">
                    /{pagesTried}
                  </span>
                )}
              </p>
            </div>
            <div className="bg-card p-3">
              <p className="text-[10px] text-muted-foreground">&gt; SIGNALS</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{signals.length}</p>
            </div>
            <div className="bg-card p-3">
              <p className="text-[10px] text-muted-foreground">&gt; AUDITED</p>
              <p className="text-[11px] font-semibold text-foreground mt-1 truncate">
                {lastChecked ? timeAgo(lastChecked).toUpperCase() : 'VERIFIED'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Body: main record + aside                                         */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {isLive ? (
            <SourcesSection
              entityId={entity.id}
              sources={entity.sources ?? []}
              passages={evidence?.passages ?? []}
            />
          ) : (
            <Section tag="[i]" title="Record summary">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {entity.ethical_analysis ??
                  'No narrative summary is stored for this sample record.'}
              </p>
            </Section>
          )}

          {entity.controversies && entity.controversies.length > 0 && (
            <Section
              tag="[!]"
              title="Controversies and issues"
              meta={`${entity.controversies.length} entries`}
            >
              <div className="space-y-3">
                {entity.controversies.map((c, i) => (
                  <div key={`${c.title}-${i}`} className="bg-destructive/5 border-l-2 border-destructive p-3 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-xs font-bold text-foreground">{c.title}</p>
                      {c.date && (
                        <span className="text-[10px] text-muted-foreground">[{c.date}]</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                    {isLive && c.source_url && (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 pt-0.5"
                      >
                        source ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {entity.disclosures && entity.disclosures.length > 0 && (
            <Section
              tag="[+]"
              title="Disclosures found"
              meta={`${entity.disclosures.length} recorded`}
            >
              <div className="space-y-3">
                {entity.disclosures.map((d, i) => (
                  <div key={`${d.title}-${i}`} className="border-l-2 border-primary/60 bg-card p-3 space-y-1">
                    <p className="text-xs font-bold text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                    {isLive && d.link && (
                      <a
                        href={d.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        disclosure link ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {entity.sponsorships && entity.sponsorships.length > 0 && (
            <Section
              tag="[§]"
              title="Brand partnerships"
              meta={`${entity.sponsorships.length} recorded`}
            >
              <ul className="divide-y divide-border -mx-1">
                {entity.sponsorships.map((s, i) => (
                  <li key={`${s.company}-${i}`} className="py-2.5 px-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-xs font-bold text-foreground">{s.company}</p>
                      {s.period && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          [{s.period}]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.details}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {entity.charitable_work && entity.charitable_work.length > 0 && (
            <Section
              tag="[*]"
              title="Charitable programs"
              meta={`${entity.charitable_work.length} recorded`}
            >
              <ul className="divide-y divide-border -mx-1">
                {entity.charitable_work.map((c, i) => (
                  <li key={`${c.organization}-${i}`} className="py-2.5 px-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-xs font-bold text-foreground">{c.organization}</p>
                      {c.year && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          [{c.year}]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.contribution}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="space-y-6 min-w-0">
          {isLive && (
            <Section
              tag="[#]"
              title="Transparency signals"
              meta={`${signals.length} found`}
            >
              {signals.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No signals detected on scanned pages.
                </p>
              ) : (
                <ul className="space-y-3">
                  {signals.map((signal, i) => (
                    <li key={`${signal.kind}-${i}`} className="space-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                      <p className={`text-xs font-bold ${SIGNAL_TONE[signal.kind] ?? ''}`}>
                        [{signal.kind.toUpperCase()}] {signal.label}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {signal.excerpt}
                      </p>
                      <a
                        href={signal.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate max-w-full"
                      >
                        <span>↳</span>
                        <span className="truncate">{signal.pageUrl.replace(/^https?:\/\//, '')}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {evidence && evidence.pages.length > 0 && (
            <Section
              tag="[=]"
              title="Pages inspected"
              meta={`${reachable}/${evidence.pages.length} read`}
            >
              <ul className="space-y-2 text-xs">
                {evidence.pages.map((page) => (
                  <li key={page.url} className="flex items-start gap-2">
                    <span
                      className={`text-xs shrink-0 ${page.ok ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {page.ok ? '✔' : '✖'}
                    </span>
                    <span className="min-w-0">
                      <span className={page.ok ? 'text-foreground' : 'text-muted-foreground'}>
                        {page.url.replace(/^https?:\/\//, '')}
                      </span>
                      {!page.ok && (
                        <span className="text-muted-foreground"> — {page.error ?? 'unreachable'}</span>
                      )}
                      {page.fetchedAt && (
                        <span className="text-[10px] text-muted-foreground block">
                          checked {timeAgo(page.fetchedAt)}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {entity.certifications && entity.certifications.length > 0 && (
            <Section tag="[§]" title="Certifications">
              <div className="flex flex-wrap gap-1.5">
                {entity.certifications.map((cert) => (
                  <span key={cert} className="text-[11px] border border-border px-2 py-0.5 text-foreground bg-secondary/30">
                    {cert}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {categories.length > 0 && (
            <Section tag="[#]" title="Categories">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <span key={category} className="text-[11px] border border-border px-2 py-0.5 text-muted-foreground">
                    #{category}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {isLive && (
            <SimilarRecords entity={entity} passages={evidence?.passages ?? []} />
          )}

          <div className="border border-border/80 bg-card p-3.5 space-y-1 text-xs text-muted-foreground">
            <span className="text-primary font-bold">[!] NOTE:</span>
            <p className="leading-relaxed">
              {isLive
                ? 'All claims cite their retrieval origin. Score quantifies verifiable disclosure volume, not moral standing.'
                : 'Curated fallback record. No live crawl attached.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
