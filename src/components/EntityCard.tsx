import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BuiltEntity } from '@/services/lookupService';
import { timeAgo } from '@/services/report';

interface Controversy {
  title: string;
  description: string;
  date?: string;
  source_url?: string;
}

export interface EntityProps {
  id: string;
  name: string;
  type: 'company' | 'creator';
  description: string;
  ethicalScore: number;
  categories: string[];
  certifications?: string[];
  controversies?: Controversy[];
  website?: string;
  ethical_analysis?: string;
  thumbnailUrl?: string;
  platformLinks?: { label: string; url: string }[];
  similarity?: number;
  linked?: boolean;
  evidence?: BuiltEntity;
}

const scoreTone = (score: number) => {
  if (score >= 70) return { cls: 'score-good', label: 'HIGH' };
  if (score >= 45) return { cls: 'score-mid',  label: 'MID'  };
  return              { cls: 'score-low',  label: 'LOW'  };
};

export const EntityCard = ({ 
  id,
  name, 
  type, 
  description, 
  ethicalScore, 
  categories,
  controversies = [],
  website,
  ethical_analysis,
  thumbnailUrl,
  similarity,
  linked = false,
  evidence
}: EntityProps) => {
  const displayScore = ethicalScore > 10 ? ethicalScore : ethicalScore * 10;
  const isLiveRecord = !!evidence;
  const siteSources = evidence?.entity.sources ?? [];
  const tone = scoreTone(displayScore);
  const lastChecked = siteSources
    .map((s) => s.fetchedAt)
    .filter((t): t is string => Boolean(t))
    .sort()
    .pop();

  return (
    <article className="dossier-card group font-mono">
      {/* Header row */}
      <div className="docket-strip">
        <span className="text-primary/90">
          [{type === 'company' ? 'CORP' : 'CREATOR'}] {name.toUpperCase()}
        </span>
        <span className="text-muted-foreground text-[10px]">
          {isLiveRecord
            ? (lastChecked ? `AUDITED ${timeAgo(lastChecked).toUpperCase()}` : 'LIVE')
            : 'SAMPLE'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Name + score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="w-8 h-8 border border-border object-cover shrink-0 grayscale contrast-125" />
            ) : (
              <div className="w-8 h-8 border border-border flex items-center justify-center shrink-0 text-primary font-bold text-xs bg-secondary/50">
                {type === 'company' ? '§' : '@'}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {name}
              </h3>
              {website && (
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {linked ? (
                    <span>{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                  ) : (
                    <a href={website} target="_blank" rel="noopener noreferrer"
                      className="hover:text-primary inline-flex items-center gap-1 transition-colors">
                      {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <span className="text-primary text-[10px]">↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Score stamp */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="shrink-0 border border-border px-2 py-1 text-right cursor-help bg-card">
                  <div className={`text-lg font-bold leading-none font-mono ${tone.cls}`}>
                    {displayScore}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">/100 COV</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs font-mono">
                Evidence coverage — proportion of verifiable primary materials found.
                Not a verdict.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Semantic match */}
        {similarity !== undefined && (
          <div className="text-[11px] font-mono text-primary/80">
            match: {Math.round(similarity * 100)}%
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Source ledger */}
        {isLiveRecord && evidence && siteSources.length > 0 && (
          <div className="border border-border/60 p-2.5 space-y-1.5 text-[11px] bg-background/60">
            <div className="flex justify-between text-muted-foreground font-bold">
              <span className="text-primary/80">&gt; SOURCES</span>
              <span>{siteSources.length} indexed</span>
            </div>
            <ul className="space-y-0.5 text-muted-foreground">
              {siteSources.slice(0, 3).map((s) => (
                <li key={s.url} className="truncate flex items-center gap-1.5">
                  <span className="text-primary/70">↳</span>
                  <span className="text-foreground/80">[{s.provider}]</span>
                  <span className="truncate">{s.title}</span>
                </li>
              ))}
            </ul>
            {evidence.siteAudit.signals.length > 0 && (
              <div className="pt-1.5 border-t border-border/40 flex items-center gap-1.5 text-primary">
                <span className="text-xs font-bold">[+]</span>
                <span>
                  {evidence.siteAudit.signals.length} disclosure signal{evidence.siteAudit.signals.length > 1 ? 's' : ''} detected
                </span>
              </div>
            )}
          </div>
        )}

        {/* Fallback analysis */}
        {!isLiveRecord && ethical_analysis && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 border-l-2 border-border pl-2">
            {ethical_analysis}
          </p>
        )}

        {/* Controversy flag */}
        {controversies.length > 0 && (
          <div className="border-l-2 border-destructive pl-2.5 py-1 space-y-0.5 bg-destructive/5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-destructive font-mono">
              <span>[!] CONTROVERSY ({controversies.length})</span>
            </div>
            <p className="text-[11px] text-foreground/80 line-clamp-2">
              <span className="font-semibold text-foreground">{controversies[0].title}:</span> {controversies[0].description}
            </p>
          </div>
        )}

        {/* Category tags */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {categories.slice(0, 4).map((cat) => (
              <span key={cat} className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5">
                #{cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
