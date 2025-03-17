
import { Card } from "@/components/ui/card";
import { 
  Leaf, 
  Users, 
  Scale, 
  ShieldCheck, 
  Building, 
  User, 
  Lightbulb, 
  Sparkles 
} from 'lucide-react';

interface ScoringExplanationProps {
  entityType: 'company' | 'creator';
}

export const ScoringExplanation = ({ entityType }: ScoringExplanationProps) => {
  return (
    <div className="space-y-6">
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          Ethics Scoring Methodology
        </h2>
        <p className="text-muted-foreground">
          Our ethics scoring system is transparent and based on verifiable data sources.
          Scores range from 0-100, with higher scores indicating better ethical practices.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            {entityType === 'company' ? (
              <Building className="w-5 h-5 text-primary" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
            <h3 className="text-lg font-medium">
              {entityType === 'company' ? 'Company' : 'Creator'} Score Components
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Environmental Impact (30%)</p>
                <p className="text-sm text-muted-foreground">
                  Carbon footprint, resource usage, waste management, and sustainability initiatives.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Social Responsibility (30%)</p>
                <p className="text-sm text-muted-foreground">
                  Labor practices, diversity and inclusion, community engagement, and human rights.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Governance (25%)</p>
                <p className="text-sm text-muted-foreground">
                  Corporate structure, transparency, ethics policies, and compliance with regulations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Innovation & Impact (15%)</p>
                <p className="text-sm text-muted-foreground">
                  Positive societal contributions, ethical innovation, and addressing global challenges.
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">How We Calculate Scores</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            <p>
              Our scoring system uses a weighted algorithm that evaluates multiple factors in each category. 
              Data is collected from:
            </p>
            
            <ul className="space-y-2 list-disc pl-5">
              <li>Public corporate disclosures and sustainability reports</li>
              <li>Independent audits and certifications</li>
              <li>News sources and investigative journalism</li>
              <li>NGO and watchdog organization reports</li>
              <li>Academic and industry research</li>
              <li>Social media analysis and public sentiment</li>
            </ul>
            
            <p className="font-medium pt-2">Score Interpretation:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-red-100 dark:bg-red-950/30 p-2 rounded-md">
                <p className="font-medium text-red-600 dark:text-red-400">0-49</p>
                <p className="text-xs">Needs Improvement</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-950/30 p-2 rounded-md">
                <p className="font-medium text-amber-600 dark:text-amber-400">50-69</p>
                <p className="text-xs">Moderate</p>
              </div>
              <div className="bg-green-100 dark:bg-green-950/30 p-2 rounded-md">
                <p className="font-medium text-green-600 dark:text-green-400">70-100</p>
                <p className="text-xs">Ethical Leader</p>
              </div>
            </div>
            
            <p className="italic mt-4">
              All scores are updated quarterly and reviewed by our ethics committee 
              composed of industry experts and academics.
            </p>
          </div>
        </Card>
      </div>
      
      <div className="bg-secondary/20 p-5 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Open Source Methodology</h3>
        <p className="text-sm mb-3">
          Our scoring system's methodology is fully open source and available for 
          public review and improvement. We believe in transparency as a key value.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href="https://github.com/ethicalscoring/methodology" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            View Github Repository
          </a>
          <a 
            href="https://ethicalscoring.org/methodology" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Read Detailed Documentation
          </a>
        </div>
      </div>
    </div>
  );
};
