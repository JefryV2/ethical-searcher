
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Info,
  Users,
  Globe,
  Scale,
  ShieldCheck,
  Award,
  ExternalLink
} from 'lucide-react';

interface CreatorTransparencyProps {
  entity: {
    name: string;
    description: string;
    ethicalScore: number;
    ethical_analysis?: string;
    disclosures?: {
      title: string;
      description: string;
      link?: string;
    }[];
    sponsorships?: {
      company: string;
      details: string;
      period?: string;
    }[];
    charitable_work?: {
      organization: string;
      contribution: string;
      year?: string;
    }[];
  };
}

export const CreatorTransparency = ({ entity }: CreatorTransparencyProps) => {
  // Display score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };
  
  const displayScore = entity.ethicalScore > 10 ? entity.ethicalScore : entity.ethicalScore * 10;

  return (
    <div className="space-y-6">
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="text-primary" />
          {entity.name} - Content Creator Transparency
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <ShieldCheck className={`w-5 h-5 ${getScoreColor(displayScore)}`} />
          <span className={`font-medium ${getScoreColor(displayScore)}`}>
            Ethics Score: {displayScore}/100
          </span>
        </div>
        <p className="text-muted-foreground">{entity.description}</p>
      </div>
      
      {entity.ethical_analysis && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Ethical Analysis</h3>
          </div>
          <p className="text-muted-foreground">{entity.ethical_analysis}</p>
        </Card>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {entity.disclosures && entity.disclosures.length > 0 && (
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium">Transparency Disclosures</h3>
            </div>
            <div className="space-y-3">
              {entity.disclosures.map((item, index) => (
                <div key={index} className="bg-secondary/20 p-3 rounded-md">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {entity.sponsorships && entity.sponsorships.length > 0 && (
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-medium">Brand Partnerships & Sponsorships</h3>
            </div>
            <div className="space-y-3">
              {entity.sponsorships.map((item, index) => (
                <div key={index} className="bg-secondary/20 p-3 rounded-md">
                  <p className="font-medium">{item.company}</p>
                  <p className="text-sm text-muted-foreground">{item.details}</p>
                  {item.period && (
                    <p className="text-xs text-muted-foreground mt-1">Period: {item.period}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      
      {entity.charitable_work && entity.charitable_work.length > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-medium">Social Impact & Charitable Work</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {entity.charitable_work.map((item, index) => (
              <div key={index} className="bg-green-500/10 dark:bg-green-950/30 p-3 rounded-md">
                <p className="font-medium">{item.organization}</p>
                <p className="text-sm text-muted-foreground">{item.contribution}</p>
                {item.year && (
                  <p className="text-xs text-muted-foreground mt-1">Year: {item.year}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      
      <div className="flex items-center rounded-md bg-secondary/20 p-4">
        <Award className="w-5 h-5 text-primary mr-2" />
        <p className="text-sm">
          Content creators on our platform commit to transparent disclosures 
          and ethical partnership practices. Learn more about our 
          <a href="#" className="text-primary hover:underline ml-1">Creator Transparency Pledge</a>.
        </p>
      </div>
    </div>
  );
};
