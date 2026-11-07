
// The detail view for one entity record.
//
// Unlike the compact search-result card, this lays out the full evidence
// pack: identity and score at the top, the audit's shape (pages tried,
// signals found, last-checked stamps), then sources, controversies and
// disclosures as readable sections with every link kept.

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Globe,
  User,
  ShieldCheck,
  AlertTriangle,
  Award,
  ExternalLink,
  FileText,
  Clock,
  Link2,
  Building2,
  Sparkles,
  Info,
} from 'lucide-react';
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

const PROVIDER_LABEL: Record<string, string> = {
  wikidata: 'Wikidata',
  wikipedia: 'Wikipedia',
  website: 'Official site',
  platform: 'Platform',
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
  title,
  icon,
  meta,
  children,
}: {
  title: string;
  icon: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) => (
  <Card className="glass-card p-5 space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-primary shrink-0">{icon}</span>
      <h2 className="ds-text-title-sm">{title}</h2>
      {meta && <span className="ml-auto ds-text-label-sm text-muted-foreground">{meta}</span>}
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
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Identity + score                                                  */}
      {/* ---------------------------------------------------------------- */}
      <Card className="glass-card p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          {entity.thumbnailUrl ? (
            <img
              src={entity.thumbnailUrl}
              alt=""
              className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              {entity.type === 'company' ? (
                <Building2 className="w-7 h-7 text-primary" />
              ) : (
                <User className="w-7 h-7 text-primary" />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ds-text-label-sm text-muted-foreground">
                {entity.type === 'company' ? 'Company' : 'Content creator'}
              </span>
              {entity.id && /^Q\d+$/.test(entity.id) && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <a
                    href={`https://www.wikidata.org/wiki/${entity.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ds-text-label-sm text-muted-foreground hover:text-primary"
                  >
                    {entity.id}
                  </a>
                </>
              )}
              {!isLive && <Badge variant="outline">sample catalog record</Badge>}
            </div>

            <h1 className="ds-text-headline-sm">{entity.name}</h1>
            <p className="ds-text-body-md text-muted-foreground max-w-2xl">{entity.description}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              {isLive && entity.website && (
                <a
                  href={entity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-text-body-sm text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {entity.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {isLive && entity.platformLinks?.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-text-body-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {p.label.replace(' (Wikidata)', '')}
                </a>
              ))}
            </div>
          </div>

          <div className="md:text-right shrink-0 md:pl-4 md:border-l md:border-border space-y-1">
            <p className="ds-text-label-sm text-muted-foreground">Evidence coverage</p>
            <p className={`ds-text-headline-md score-num ${tone}`}>
              {displayScore}
              <span className="ds-text-body-md text-muted-foreground font-normal">/100</span>
            </p>
            <p className="ds-text-body-sm text-muted-foreground max-w-[26ch] md:ml-auto">
              {isLive
                ? 'How much first-party transparency material was found publicly — not a verdict.'
                : 'Illustrative sample score from the curated fallback catalog.'}
            </p>
          </div>
        </div>

        {isLive && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-md overflow-hidden mt-6 border border-border">
            <div className="bg-card p-3">
              <p className="ds-text-label-sm text-muted-foreground">Sources</p>
              <p className="ds-text-title-md score-num">{entity.sources?.length ?? 0}</p>
            </div>
            <div className="bg-card p-3">
              <p className="ds-text-label-sm text-muted-foreground">Site pages read</p>
              <p className="ds-text-title-md score-num">
                {reachable}
                {pagesTried > 0 && (
                  <span className="ds-text-body-sm text-muted-foreground font-normal">
                    {' '}/ {pagesTried} tried
                  </span>
                )}
              </p>
            </div>
            <div className="bg-card p-3">
              <p className="ds-text-label-sm text-muted-foreground">Signals</p>
              <p className="ds-text-title-md score-num">{signals.length}</p>
            </div>
            <div className="bg-card p-3">
              <p className="ds-text-label-sm text-muted-foreground">Last checked</p>
              <p className="ds-text-title-sm">{lastChecked ? timeAgo(lastChecked) : '—'}</p>
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
            <Section
              title="Sources"
              icon={<FileText className="w-4 h-4" />}
              meta={`${entity.sources?.length ?? 0} recorded`}
            >
              <ul className="divide-y divide-border -mx-1">
                {entity.sources?.map((source) => (
                  <li key={`${source.provider}-${source.url}`} className="py-3 px-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-normal">
                        {PROVIDER_LABEL[source.provider] ?? source.provider}
                      </Badge>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ds-text-body-sm font-medium hover:text-primary inline-flex items-center gap-1 min-w-0"
                      >
                        <span className="truncate">{source.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      {source.fetchedAt && (
                        <span className="ds-text-label-sm text-muted-foreground ml-auto inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          checked {timeAgo(source.fetchedAt)}
                        </span>
                      )}
                    </div>
                    {source.excerpt && (
                      <p className="ds-text-body-sm text-muted-foreground line-clamp-3">
                        {source.excerpt}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          ) : (
            <Section title="Record summary" icon={<Info className="w-4 h-4" />}>
              <p className="ds-text-body-sm text-muted-foreground">
                {entity.ethical_analysis ??
                  'No narrative summary is stored for this sample record.'}
              </p>
            </Section>
          )}

          {entity.controversies && entity.controversies.length > 0 && (
            <Section
              title="Controversies and issues"
              icon={<AlertTriangle className="w-4 h-4" />}
              meta={`${entity.controversies.length} reported`}
            >
              <div className="space-y-3">
                {entity.controversies.map((c, i) => (
                  <div key={`${c.title}-${i}`} className="bg-warning-subtle rounded-md p-3 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="ds-text-body-sm font-medium">{c.title}</p>
                      {c.date && (
                        <span className="ds-text-label-sm text-muted-foreground">{c.date}</span>
                      )}
                    </div>
                    <p className="ds-text-body-sm text-muted-foreground">{c.description}</p>
                    {isLive && c.source_url && (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ds-text-body-sm text-primary hover:underline inline-flex items-center gap-1 pt-0.5"
                      >
                        Read the source
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {entity.disclosures && entity.disclosures.length > 0 && (
            <Section
              title="Disclosures found"
              icon={<ShieldCheck className="w-4 h-4" />}
              meta={`${entity.disclosures.length} recorded`}
            >
              <div className="space-y-3">
                {entity.disclosures.map((d, i) => (
                  <div key={`${d.title}-${i}`} className="border border-border rounded-md p-3 space-y-1">
                    <p className="ds-text-body-sm font-medium">{d.title}</p>
                    <p className="ds-text-body-sm text-muted-foreground">{d.description}</p>
                    {isLive && d.link && (
                      <a
                        href={d.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ds-text-body-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Open disclosure
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {entity.sponsorships && entity.sponsorships.length > 0 && (
            <Section
              title="Brand partnerships"
              icon={<Award className="w-4 h-4" />}
              meta={`${entity.sponsorships.length} recorded`}
            >
              <ul className="divide-y divide-border -mx-1">
                {entity.sponsorships.map((s, i) => (
                  <li key={`${s.company}-${i}`} className="py-3 px-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="ds-text-body-sm font-medium">{s.company}</p>
                      {s.period && (
                        <span className="ds-text-label-sm text-muted-foreground ml-auto">
                          {s.period}
                        </span>
                      )}
                    </div>
                    <p className="ds-text-body-sm text-muted-foreground">{s.details}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {entity.charitable_work && entity.charitable_work.length > 0 && (
            <Section
              title="Charitable work"
              icon={<Sparkles className="w-4 h-4" />}
              meta={`${entity.charitable_work.length} recorded`}
            >
              <ul className="divide-y divide-border -mx-1">
                {entity.charitable_work.map((c, i) => (
                  <li key={`${c.organization}-${i}`} className="py-3 px-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="ds-text-body-sm font-medium">{c.organization}</p>
                      {c.year && (
                        <span className="ds-text-label-sm text-muted-foreground ml-auto">
                          {c.year}
                        </span>
                      )}
                    </div>
                    <p className="ds-text-body-sm text-muted-foreground">{c.contribution}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="space-y-6 min-w-0">
          {isLive && (
            <Section
              title="Transparency signals"
              icon={<Sparkles className="w-4 h-4" />}
              meta={`${signals.length} found`}
            >
              {signals.length === 0 ? (
                <p className="ds-text-body-sm text-muted-foreground">
                  No transparency signals were detected on the pages that could be read.
                </p>
              ) : (
                <ul className="space-y-3">
                  {signals.map((signal, i) => (
                    <li key={`${signal.kind}-${i}`} className="space-y-1">
                      <p className={`ds-text-body-sm font-medium ${SIGNAL_TONE[signal.kind] ?? ''}`}>
                        {signal.label}
                      </p>
                      <p className="ds-text-body-sm text-muted-foreground line-clamp-2">
                        {signal.excerpt}
                      </p>
                      <a
                        href={signal.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ds-text-label-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                      >
                        {signal.pageUrl.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {evidence && evidence.pages.length > 0 && (
            <Section
              title="Pages checked"
              icon={<Clock className="w-4 h-4" />}
              meta={`${reachable}/${evidence.pages.length} read`}
            >
              <ul className="space-y-2">
                {evidence.pages.map((page) => (
                  <li key={page.url} className="flex items-start gap-2 ds-text-body-sm">
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        page.ok ? 'bg-primary' : 'bg-border'
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className={page.ok ? '' : 'text-muted-foreground'}>
                        {page.url.replace(/^https?:\/\//, '')}
                      </span>
                      {!page.ok && (
                        <span className="text-muted-foreground"> — {page.error ?? 'not readable'}</span>
                      )}
                      {page.fetchedAt && (
                        <span className="ds-text-label-sm text-muted-foreground block">
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
            <Section title="Certifications (claimed)" icon={<Award className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-2">
                {entity.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary">
                    {cert}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {categories.length > 0 && (
            <Section title="Categories" icon={<Globe className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="outline" className="font-normal">
                    {category}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          <div className="rounded-md bg-secondary/40 p-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="ds-text-body-sm text-muted-foreground">
              {isLive
                ? 'Every item above links to where it was read. The score measures how much verifiable material exists in public sources, not whether the entity behaves ethically.'
                : 'This is a curated sample record, kept as a fallback when no live public record can be found. Its score is illustrative, and external links are omitted because no live source is attached.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
