
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

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  // Website link is interactive only when the card is not itself wrapped in a
  // <Link> — an <a> nested inside an <a> is invalid and React warns about it.
  return (
    <Card className="glass-card hover:scale-[1.02] p-6 space-y-4 overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : type === 'company' ? (
            <Globe className="w-6 h-6 text-primary shrink-0" />
          ) : (
            <User className="w-6 h-6 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{type}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help shrink-0">
                {similarity !== undefined && (
                  <Badge variant="outline" className="text-primary border-primary/40">
                    {Math.round(similarity * 100)}% match
                  </Badge>
                )}
                {isLiveRecord && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    <FileText className="w-3 h-3 mr-1" />
                    {siteSources.length} sources
                  </Badge>
                )}
                <ShieldCheck className={`w-5 h-5 ${getScoreColor(displayScore)}`} />
                <span className={`font-medium ${getScoreColor(displayScore)}`}>{displayScore}/100</span>
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
                <p>Ethics Score: Based on environmental impact, labor practices, and social responsibility{similarity !== undefined && " · '% match' is the embedding similarity from the on-device model"}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {website && (
        <div className="text-sm text-primary">
          {linked ? (
            <span className="hover:underline truncate block">{website}</span>
          ) : (
            <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline">{website}</a>
          )}
        </div>
      )}
      
      {platformLinks && platformLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {platformLinks.map((p) => (
            <Badge key={p.url} variant="outline" className="text-muted-foreground">
              <Upload className="w-3 h-3 mr-1" />
              {p.label}
            </Badge>
          ))}
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">{description}</p>
      
      {isLiveRecord && evidence && (
        <div className="bg-secondary/20 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-medium">Scraped evidence</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {siteSources.slice(0, 4).map((s) => (
              <li key={s.url} className="truncate">
                <span className="uppercase text-[10px] mr-1 text-muted-foreground/70">{s.provider}</span>
                {s.title}
              </li>
            ))}
          </ul>
          {evidence.siteAudit.signals.length > 0 && (
            <p className="text-xs mt-2">
              {evidence.siteAudit.signals.length} transparency signal
              {evidence.siteAudit.signals.length === 1 ? '' : 's'} detected:
              {' '}{evidence.siteAudit.signals.slice(0, 3).map((s) => s.label).join(', ')}
            </p>
          )}
          {evidence.siteAudit.pages.length > 0 && evidence.siteAudit.reachable === 0 && (
            <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
              The official site could not be read ({evidence.siteAudit.pages[0].error ?? 'unknown reason'}) —
              the record currently rests on Wikidata and Wikipedia only.
            </p>
          )}
        </div>
      )}
      
      {!isLiveRecord && ethical_analysis && (
        <div className="bg-secondary/20 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-medium">Record summary</span>
          </div>
          <p className="text-muted-foreground line-clamp-6">
            {ethical_analysis.length > 420
              ? `${ethical_analysis.slice(0, 420).trimEnd()}… Full evidence on the detail page.`
              : ethical_analysis}
          </p>
        </div>
      )}
      
      {certifications && certifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Certifications</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, index) => (
              <Badge key={index} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {controversies && controversies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">{isLiveRecord ? 'Issue-related mentions' : 'Known Controversies'}</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {controversies.map((controversy, index) => (
              <div key={index} className="bg-amber-500/10 p-2 rounded-md text-xs">
                <p className="font-medium">{controversy.title}</p>
                <p className="text-muted-foreground">{controversy.description}</p>
                <div className="flex items-center justify-between mt-1">
                  {controversy.date && <p className="text-xs opacity-70">{new Date(controversy.date).toLocaleDateString()}</p>}
                  {controversy.source_url && !linked && (
                    <a 
                      href={controversy.source_url} 
                      className="flex items-center gap-1 text-primary text-xs hover:underline"
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
