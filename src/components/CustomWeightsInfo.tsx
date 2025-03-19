
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SlidersHorizontal } from 'lucide-react';

interface CustomWeightsInfoProps {
  onDismiss: () => void;
}

export const CustomWeightsInfo = ({ onDismiss }: CustomWeightsInfoProps) => {
  return (
    <Alert className="mb-6 border-primary/50 bg-primary/10">
      <SlidersHorizontal className="h-5 w-5 text-primary" />
      <AlertTitle>Personalize Your Ethical Scoring</AlertTitle>
      <AlertDescription>
        Adjust the scoring weights below to match your personal values and see entity scores that reflect what matters most to you.
      </AlertDescription>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-2"
        onClick={onDismiss}
      >
        Got it
      </Button>
    </Alert>
  );
};
