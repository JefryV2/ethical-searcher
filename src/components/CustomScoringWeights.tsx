
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  SlidersHorizontal, 
  Leaf, 
  Users, 
  Scale, 
  Sparkles,
  Megaphone,
  BookOpen,
  HeartHandshake,
  Recycle,
  GlobeLock, 
  Save
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MetricWeight {
  id: string;
  name: string;
  defaultWeight: number;
  currentWeight: number;
  icon: JSX.Element;
  description: string;
}

interface ScoringWeightsProps {
  entityType: 'company' | 'creator';
  onSaveWeights: (weights: Record<string, number>) => void;
  savedWeights?: Record<string, number>;
}

export const CustomScoringWeights = ({ 
  entityType, 
  onSaveWeights,
  savedWeights 
}: ScoringWeightsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(() => {
    // Open by default if there are no saved weights yet
    return !savedWeights || Object.keys(savedWeights).length === 0;
  });
  const [metrics, setMetrics] = useState<MetricWeight[]>([]);
  const [totalWeight, setTotalWeight] = useState(100);
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  
  const form = useForm();
  
  // Initialize metrics based on entity type
  useEffect(() => {
    if (entityType === 'company') {
      setMetrics([
        {
          id: 'environmental',
          name: 'Environmental Impact',
          defaultWeight: 30,
          currentWeight: savedWeights?.environmental || 30,
          icon: <Leaf className="w-5 h-5 text-green-500" />,
          description: 'Carbon footprint, resource usage, sustainability initiatives'
        },
        {
          id: 'social',
          name: 'Social Responsibility',
          defaultWeight: 30,
          currentWeight: savedWeights?.social || 30,
          icon: <Users className="w-5 h-5 text-blue-500" />,
          description: 'Labor practices, diversity, community engagement'
        },
        {
          id: 'governance',
          name: 'Governance',
          defaultWeight: 25,
          currentWeight: savedWeights?.governance || 25,
          icon: <Scale className="w-5 h-5 text-amber-500" />,
          description: 'Corporate structure, transparency, ethics policies'
        },
        {
          id: 'innovation',
          name: 'Innovation & Impact',
          defaultWeight: 15,
          currentWeight: savedWeights?.innovation || 15,
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          description: 'Positive societal contributions, ethical innovation'
        }
      ]);
    } else {
      setMetrics([
        {
          id: 'transparency',
          name: 'Transparency & Disclosure',
          defaultWeight: 35,
          currentWeight: savedWeights?.transparency || 35,
          icon: <Megaphone className="w-5 h-5 text-blue-500" />,
          description: 'Sponsorship disclosure, financial relationship transparency'
        },
        {
          id: 'integrity',
          name: 'Content Integrity',
          defaultWeight: 25,
          currentWeight: savedWeights?.integrity || 25,
          icon: <BookOpen className="w-5 h-5 text-purple-500" />,
          description: 'Accuracy of information, research quality, balance'
        },
        {
          id: 'social',
          name: 'Social Impact',
          defaultWeight: 20,
          currentWeight: savedWeights?.social || 20,
          icon: <HeartHandshake className="w-5 h-5 text-amber-500" />,
          description: 'Advocacy, charitable work, positive influence'
        },
        {
          id: 'environmental',
          name: 'Environmental Advocacy',
          defaultWeight: 10,
          currentWeight: savedWeights?.environmental || 10,
          icon: <Recycle className="w-5 h-5 text-green-500" />,
          description: 'Sustainable practices, climate awareness'
        },
        {
          id: 'audience',
          name: 'Audience Responsibility',
          defaultWeight: 10,
          currentWeight: savedWeights?.audience || 10,
          icon: <GlobeLock className="w-5 h-5 text-red-500" />,
          description: 'Audience respect, data privacy, moderation policies'
        }
      ]);
    }
    
    // Check if we should enable custom weights
    if (savedWeights && Object.keys(savedWeights).length > 0) {
      setUseCustomWeights(true);
    }
  }, [entityType, savedWeights]);
  
  // Update total weight when metrics change
  useEffect(() => {
    const newTotal = metrics.reduce((sum, metric) => sum + metric.currentWeight, 0);
    setTotalWeight(newTotal);
  }, [metrics]);
  
  // Handle slider change
  const handleWeightChange = (id: string, value: number[]) => {
    const newValue = value[0];
    setMetrics(metrics.map(metric => 
      metric.id === id ? { ...metric, currentWeight: newValue } : metric
    ));
  };
  
  // Reset to default values
  const handleReset = () => {
    setMetrics(metrics.map(metric => ({
      ...metric,
      currentWeight: metric.defaultWeight
    })));
  };
  
  // Save custom weights
  const handleSave = () => {
    // Create a map of metric IDs to their weights
    const weightMap = metrics.reduce((map, metric) => {
      map[metric.id] = metric.currentWeight;
      return map;
    }, {} as Record<string, number>);
    
    // Check if weights are balanced to 100%
    if (totalWeight !== 100) {
      toast({
        title: "Weights must total 100%",
        description: `Your weights currently add up to ${totalWeight}%`,
        variant: "destructive"
      });
      return;
    }
    
    onSaveWeights(weightMap);
    toast({
      title: "Custom weights saved",
      description: "Your personalized ethical scoring weights have been saved",
    });
  };
  
  const handleCustomWeightsToggle = (checked: boolean) => {
    setUseCustomWeights(checked);
    if (!checked) {
      // Reset to default if turning off custom weights
      onSaveWeights({});
      handleReset();
    } else {
      // Open the collapsible when enabling custom weights
      setIsOpen(true);
    }
  };
  
  return (
    <Card className="shadow-md border-primary/20 transition-all hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Personalize Ethical Scoring</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={useCustomWeights} 
                  onCheckedChange={handleCustomWeightsToggle}
                  id="custom-weights"
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="custom-weights" className="font-medium">
                  Use Custom Weights
                </FormLabel>
              </div>
            </FormItem>
          </div>
        </div>
        <CardDescription>
          Adjust how ethical factors are weighted to match your personal values
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex w-full justify-between p-4 text-primary hover:bg-primary/5"
          >
            <span>{isOpen ? 'Hide Weights' : 'Customize Weights'}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {metric.currentWeight}%
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      defaultValue={[metric.defaultWeight]}
                      value={[metric.currentWeight]}
                      max={100}
                      step={5}
                      onValueChange={(value) => handleWeightChange(metric.id, value)}
                      disabled={!useCustomWeights}
                      className={useCustomWeights ? "" : "opacity-50"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              ))}
              
              <div className={`flex items-center justify-between py-2 font-medium ${
                totalWeight !== 100 ? 'text-destructive' : 'text-primary'
              }`}>
                <span>Total:</span>
                <span>{totalWeight}%</span>
              </div>
              
              {totalWeight !== 100 && (
                <p className="text-sm text-destructive mb-2">
                  Your weights must total exactly 100% to save your preferences.
                </p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between gap-4 border-t p-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={!useCustomWeights}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Default
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              disabled={!useCustomWeights || totalWeight !== 100}
              className="flex-1 bg-primary"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Custom Weights
            </Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
