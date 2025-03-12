
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Globe, User, ShieldCheck } from 'lucide-react';

interface EntityProps {
  name: string;
  type: 'company' | 'creator';
  description: string;
  ethicalScore: number;
  categories: string[];
}

export const EntityCard = ({ name, type, description, ethicalScore, categories }: EntityProps) => {
  return (
    <Card className="glass-card hover:scale-[1.02] p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {type === 'company' ? (
            <Globe className="w-6 h-6 text-primary" />
          ) : (
            <User className="w-6 h-6 text-primary" />
          )}
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="font-medium">{ethicalScore}/10</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">{description}</p>
      
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
