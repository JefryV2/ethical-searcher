
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Globe, User, ShieldCheck, AlertTriangle, Award, Info, ExternalLink, FileText, Upload } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BuiltEntity } from '@/services/lookupService';

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
  /** Optional embedding similarity (0-1) from an on-device model ranking. */
  similarity?: number;
  /** True when the whole card is wrapped in a navigation link, so the
   *  website anchor must not be an <a> (invalid nesting inside <a>). */
  linked?: boolean;
  /** Scraped evidence bundle, present for live records. */
  evidence?: BuiltEntity;
}

/* Score bands use the design system's semantic text colors, not the raw
   Tailwind palette — they stay readable in both themes. */
const scoreTone = (score: number): string => {
  if (score >= 70) return "score-good";
  if (score >= 50) return "score-mid";
  return "score-low";
};

export const EntityCard = ({ 
  name, 
  type, 
  description, 
  ethicalScore, 
  categories,
  certifications = [], 
  controversies = [],
  website,
  ethical_analysis,
  thumbnailUrl,
  platformLinks,
  similarity,
  linked = false,
  evidence
}: EntityProps) => {
  // Convert ethicalScore from 0-10 to 0-100 scale if needed
  const displayScore = ethicalScore > 10 ? ethicalScore : ethicalScore * 10;
  const isLiveRecord = !!evidence;
  const siteSources = evidence?.entity.sources ?? [];
  const pageSize = evidence ? evidence.siteAudit.reachable : 0;
  const tone = scoreTone(displayScore);

  // Website link is interactive only when the card is not itself wrapped in a
  // <Link> — an <a> nested inside an <a> is invalid and React warns about it.
  return (
    <Card className="glass-card hover-lift p-6 space-y-4 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : type === 'company' ? (
            <Globe className="w-6 h-6 text-primary shrink-0" />
          ) : (
            <User className="w-6 h-6 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="ds-text-title-md truncate">{name}</h3>
            <p className="ds-text-label-sm text-muted-foreground capitalize">{type}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-baseline gap-1 cursor-help shrink-0 score-num ${tone}`}>
                <span className="ds-text-numeric-lg leading-none">{displayScore}</span>
                <span className="ds-text-body-sm text-muted-foreground">/100</span>
                <ShieldCheck className={`w-4 h-4 -mb-1 ml-1 ${tone}`} />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {isLiveRecord ? (
                <p>
                  Evidence coverage: how much first-party transparency material was found in public
                  sources ({pageSize} site page{pageSize === 1 ? '' : 's'} read{wikiReadable(siteSources)}).
                  It says what a reader can verify — not whether the entity is ethical.
                </p>
              ) : (
                <p>Sample catalog score{similarity !== undefined && " · '% match' is the embedding similarity from the on-device model"}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {(similarity !== undefined || isLiveRecord) && (
        <div className="flex flex-wrap gap-2 -mt-2">
          {similarity !== undefined && (
            <Badge variant="secondary">{Math.round(similarity * 100)}% match</Badge>
          )}
          {isLiveRecord && (
            <Badge variant="secondary" className="gap-1">
              <FileText className="w-3 h-3" />
              {siteSources.length} sources
            </Badge>
          )}
        </div>
      )}
      
      {website && (
        <div className="ds-text-body-sm text-primary">
          {linked ? (
            <span className="truncate block">{website}</span>
          ) : (
            <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline">{website}</a>
          )}
        </div>
      )}
      
      {platformLinks && platformLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {platformLinks.map((p) => (
            <Badge key={p.url} variant="outline" className="text-muted-foreground font-normal">
              {p.label}
            </Badge>
          ))}
        </div>
      )}
      
      <p className="ds-text-body-sm text-muted-foreground">{description}</p>
      
      {isLiveRecord && evidence && (
        <div className="bg-secondary/40 p-3 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <span className="ds-text-body-sm font-medium">Scraped evidence</span>
          </div>
          <ul className="ds-text-body-sm text-muted-foreground space-y-1">
            {siteSources.slice(0, 4).map((s) => (
              <li key={s.url} className="truncate">
                <span className="ds-text-label-sm text-muted-foreground/70 mr-1">{s.provider}</span>
                {s.title}
              </li>
            ))}
          </ul>
          {evidence.siteAudit.signals.length > 0 && (
            <p className="ds-text-body-sm mt-2">
              {evidence.siteAudit.signals.length} transparency signal
              {evidence.siteAudit.signals.length === 1 ? '' : 's'} detected:
              {' '}{evidence.siteAudit.signals.slice(0, 3).map((s) => s.label).join(', ')}
            </p>
          )}
          {evidence.siteAudit.pages.length > 0 && evidence.siteAudit.reachable === 0 && (
            <p className="ds-text-body-sm mt-2 score-mid">
              The official site could not be read ({evidence.siteAudit.pages[0].error ?? 'unknown reason'}) —
              the record currently rests on Wikidata and Wikipedia only.
            </p>
          )}
        </div>
      )}
      
      {!isLiveRecord && ethical_analysis && (
        <div className="bg-secondary/40 p-3 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <span className="ds-text-body-sm font-medium">Record summary</span>
          </div>
          <p className="ds-text-body-sm text-muted-foreground line-clamp-6">
            {ethical_analysis.length > 420
              ? `${ethical_analysis.slice(0, 420).trimEnd()}… Full evidence on the detail page.`
              : ethical_analysis}
          </p>
        </div>
      )}
      
      {certifications && certifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="ds-text-body-sm font-medium">Certifications</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, index) => (
              <Badge key={index} variant="secondary">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {controversies && controversies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 score-mid" />
            <span className="ds-text-body-sm font-medium">{isLiveRecord ? 'Issue-related mentions' : 'Known Controversies'}</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {controversies.map((controversy, index) => (
              <div key={index} className="bg-warning-subtle p-2 rounded-md">
                <p className="ds-text-body-sm font-medium">{controversy.title}</p>
                <p className="ds-text-body-sm text-muted-foreground">{controversy.description}</p>
                <div className="flex items-center justify-between mt-1">
                  {controversy.date && <p className="ds-text-body-sm text-muted-foreground">{new Date(controversy.date).toLocaleDateString()}</p>}
                  {controversy.source_url && !linked && (
                    <a 
                      href={controversy.source_url} 
                      className="flex items-center gap-1 text-primary ds-text-body-sm hover:underline"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category} variant="secondary">
            {category}
          </Badge>
        ))}
      </div>
    </Card>
  );
};

function wikiReadable(sources: { provider: string }[]): string {
  return sources.some((s) => s.provider === 'wikipedia') ? ', plus a Wikipedia summary' : '';
}
