
import { Card } from "@/components/ui/card";
import { 
  Leaf, 
  Users, 
  Scale, 
  ShieldCheck, 
  Building, 
  User, 
  Lightbulb, 
  Sparkles,
  GlobeLock,
  HeartHandshake,
  Megaphone,
  BookOpen,
  Recycle
} from 'lucide-react';

interface ScoringExplanationProps {
  entityType: 'company' | 'creator';
}

export const ScoringExplanation = ({ entityType }: ScoringExplanationProps) => {
  // Different weighting based on entity type
  const getMetrics = () => {
    if (entityType === 'company') {
      return [
        {
          icon: <Leaf className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />,
          title: "Environmental Impact (30%)",
          description: "Carbon footprint, resource usage, waste management, sustainability initiatives, and commitment to climate goals.",
          submetrics: [
            "Carbon emissions reduction (10%)",
            "Sustainable resource management (8%)",
            "Waste reduction and circular economy initiatives (7%)",
            "Environmental policy enforcement (5%)"
          ]
        },
        {
          icon: <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
          title: "Social Responsibility (30%)",
          description: "Labor practices, diversity and inclusion, community engagement, and human rights throughout supply chain.",
          submetrics: [
            "Fair labor practices and living wages (8%)",
            "Diversity, equity & inclusion initiatives (7%)",
            "Supply chain ethics and transparency (8%)",
            "Community investment and impact (7%)"
          ]
        },
        {
          icon: <Scale className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
          title: "Governance (25%)",
          description: "Corporate structure, transparency, ethics policies, anti-corruption measures, and compliance with regulations.",
          submetrics: [
            "Leadership diversity and compensation ratios (5%)",
            "Anti-corruption policies and implementation (7%)",
            "Stakeholder engagement practices (5%)",
            "Transparency in reporting and communication (8%)"
          ]
        },
        {
          icon: <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />,
          title: "Innovation & Impact (15%)",
          description: "Positive societal contributions, ethical innovation, product safety, and addressing global challenges.",
          submetrics: [
            "Ethical product development (5%)",
            "Societal benefit of business model (5%)",
            "Research & development focused on sustainability (5%)"
          ]
        }
      ];
    } else {
      // Creator-specific metrics
      return [
        {
          icon: <Megaphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
          title: "Transparency & Disclosure (35%)",
          description: "Openness about sponsorships, income sources, conflicts of interest, and affiliate relationships.",
          submetrics: [
            "Sponsorship disclosure compliance (12%)", 
            "Financial relationship transparency (10%)",
            "Affiliate link disclosure (8%)",
            "Product receipt disclosure (5%)"
          ]
        },
        {
          icon: <BookOpen className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />,
          title: "Content Integrity (25%)",
          description: "Accuracy of information, research quality, correction of errors, and balance in presentation.",
          submetrics: [
            "Factual accuracy and sourcing (10%)",
            "Editorial independence (8%)",
            "Correction policy implementation (7%)"
          ]
        },
        {
          icon: <HeartHandshake className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
          title: "Social Impact (20%)",
          description: "Advocacy, charitable work, positive influence, and community building initiatives.",
          submetrics: [
            "Charitable giving and volunteering (8%)",
            "Platform use for social good (7%)",
            "Community building and support (5%)"
          ]
        },
        {
          icon: <Recycle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />,
          title: "Environmental Advocacy (10%)",
          description: "Promotion of sustainable practices, climate awareness, and personal environmental footprint.",
          submetrics: [
            "Promotion of sustainable products (4%)",
            "Personal sustainability practices (3%)",
            "Environmental education efforts (3%)"
          ]
        },
        {
          icon: <GlobeLock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
          title: "Audience Responsibility (10%)",
          description: "Audience respect, data privacy, moderation policies, and handling of sensitive topics.",
          submetrics: [
            "Audience data privacy practices (4%)",
            "Comment moderation and community guidelines (3%)",
            "Responsible handling of sensitive topics (3%)"
          ]
        }
      ];
    }
  };

  const metrics = getMetrics();

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
          Methodology is specifically tailored to {entityType === 'company' ? 'corporate' : 'content creator'} ethics.
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
          
          <div className="space-y-5">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start gap-3">
                  {metric.icon}
                  <div>
                    <p className="font-medium">{metric.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
                </div>
                <div className="pl-8 space-y-1">
                  {metric.submetrics.map((submetric, subIndex) => (
                    <p key={subIndex} className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70"></span>
                      {submetric}
                    </p>
                  ))}
                </div>
              </div>
            ))}
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
              We update scores quarterly based on new information from:
            </p>
            
            <ul className="space-y-2 list-disc pl-5">
              {entityType === 'company' ? (
                <>
                  <li>Public corporate disclosures and sustainability reports</li>
                  <li>Independent audits and certifications</li>
                  <li>News sources and investigative journalism</li>
                  <li>NGO and watchdog organization reports</li>
                  <li>Academic and industry research</li>
                  <li>Social media analysis and public sentiment</li>
                </>
              ) : (
                <>
                  <li>Content analysis across platforms</li>
                  <li>Disclosure and transparency audits</li>
                  <li>Fact-checking organization reports</li>
                  <li>Public disclosure statements</li>
                  <li>Community feedback and advocacy groups</li>
                  <li>Independent ethics reviews</li>
                </>
              )}
            </ul>
            
            <p className="font-medium pt-2">Score Interpretation:</p>
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              <div className="bg-red-100 dark:bg-red-950/30 p-2 rounded-md">
                <p className="font-medium text-red-600 dark:text-red-400">0-29</p>
                <p>Poor</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-950/30 p-2 rounded-md">
                <p className="font-medium text-orange-600 dark:text-orange-400">30-49</p>
                <p>Needs Work</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-950/30 p-2 rounded-md">
                <p className="font-medium text-amber-600 dark:text-amber-400">50-69</p>
                <p>Moderate</p>
              </div>
              <div className="bg-lime-100 dark:bg-lime-950/30 p-2 rounded-md">
                <p className="font-medium text-lime-600 dark:text-lime-400">70-89</p>
                <p>Strong</p>
              </div>
              <div className="bg-green-100 dark:bg-green-950/30 p-2 rounded-md">
                <p className="font-medium text-green-600 dark:text-green-400">90-100</p>
                <p>Exemplary</p>
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
