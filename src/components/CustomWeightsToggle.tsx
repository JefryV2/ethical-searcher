
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from 'lucide-react';
import { CustomScoringWeights } from '@/components/CustomScoringWeights';

interface CustomWeightsToggleProps {
  showCustomWeights: boolean;
  toggleCustomWeights: () => void;
  entityType: 'company' | 'creator';
  savedWeights: Record<string, number>;
  onSaveWeights: (weights: Record<string, number>) => void;
}

export const CustomWeightsToggle = ({ 
  showCustomWeights, 
  toggleCustomWeights, 
  entityType,
  savedWeights,
  onSaveWeights
}: CustomWeightsToggleProps) => {
  return (
    <div className="mb-6">
      <Button
        variant="outline"
        className="mb-4 flex items-center gap-2"
        onClick={toggleCustomWeights}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {showCustomWeights ? "Hide Custom Weights" : "Customize Ethical Weights"}
      </Button>
      
      {showCustomWeights && (
        <div className="p-4 border rounded-lg bg-card">
          <CustomScoringWeights 
            entityType={entityType} 
            onSaveWeights={onSaveWeights}
            savedWeights={savedWeights}
          />
        </div>
      )}
    </div>
  );
};
