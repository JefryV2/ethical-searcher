
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Globe, User, ShieldCheck, AlertTriangle, Award, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Controversy {
  title: string;
  description: string;
  date?: string;
  source_url?: string;
}

interface EntityProps {
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
  ethical_analysis
}: EntityProps) => {
  // Convert ethicalScore from 0-10 to 0-100 scale if needed
  const displayScore = ethicalScore > 10 ? ethicalScore : ethicalScore * 10;
  
  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Card className="glass-card hover:scale-[1.02] p-6 space-y-4 overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {type === 'company' ? (
            <Globe className="w-6 h-6 text-primary" />
          ) : (
            <User className="w-6 h-6 text-primary" />
          )}
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{type}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <ShieldCheck className={`w-5 h-5 ${getScoreColor(displayScore)}`} />
                <span className={`font-medium ${getScoreColor(displayScore)}`}>{displayScore}/100</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ethics Score: Based on environmental impact, labor practices, and social responsibility</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {website && (
        <div className="text-sm text-primary hover:underline">
          <a href={website} target="_blank" rel="noopener noreferrer">{website}</a>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">{description}</p>
      
      {ethical_analysis && (
        <div className="bg-secondary/20 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-medium">Ethical Analysis</span>
          </div>
          <p className="text-muted-foreground">{ethical_analysis}</p>
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
            <span className="text-sm font-medium">Known Controversies</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {controversies.map((controversy, index) => (
              <div key={index} className="bg-amber-500/10 p-2 rounded-md text-xs">
                <p className="font-medium">{controversy.title}</p>
                <p className="text-muted-foreground">{controversy.description}</p>
                {controversy.date && <p className="text-xs opacity-70">{new Date(controversy.date).toLocaleDateString()}</p>}
                {controversy.source_url && (
                  <a 
                    href={controversy.source_url} 
                    className="text-primary text-xs hover:underline block mt-1"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Source
                  </a>
                )}
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
