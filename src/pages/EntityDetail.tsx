
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EntityCard } from '@/components/EntityCard';
import { ScoringExplanation } from '@/components/ScoringExplanation';
import { CreatorTransparency } from '@/components/CreatorTransparency';
import { CustomScoringWeights } from '@/components/CustomScoringWeights';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { mockEthicalData } from '@/services/ethicalDataService';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const EntityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [showWeightsInfo, setShowWeightsInfo] = useState(true);
  const [showCustomWeights, setShowCustomWeights] = useState(false);

  useEffect(() => {
    // Load saved weights from localStorage if they exist
    const savedWeights = localStorage.getItem('customEthicalWeights');
    if (savedWeights) {
      try {
        setCustomWeights(JSON.parse(savedWeights));
      } catch (error) {
        console.error("Error parsing saved weights:", error);
        // If there's an error parsing the weights, clear them
        localStorage.removeItem('customEthicalWeights');
      }
    }
  }, []);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from an API using the ID
        // For now, using mock data
        const foundEntity = mockEthicalData.find(e => e.id === id);
        if (foundEntity) {
          // Apply custom weights to recalculate the score if needed
          if (Object.keys(customWeights).length > 0) {
            let adjustedEntity = {...foundEntity};
            // In a real implementation, this would actually recalculate the score
            // based on the custom weights and raw data
            // For demo purposes, we're just showing the original score
          }
          setEntity(foundEntity);
        } else {
          toast({
            title: "Entity not found",
            description: "We couldn't find that company or creator",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading entity:", error);
        toast({
          title: "Error loading entity",
          description: "Please try again later",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEntityData();
  }, [id, navigate, toast, customWeights]);

  const handleSaveWeights = (weights: Record<string, number>) => {
    setCustomWeights(weights);
    localStorage.setItem('customEthicalWeights', JSON.stringify(weights));
    
    // In a real implementation, this would trigger a recalculation of scores
    // based on the custom weights
    
    // For now, we'll just show a confirmation toast
    if (Object.keys(weights).length > 0) {
      toast({
        title: "Weights Updated",
        description: "Entity scores will now reflect your personal values",
      });
    } else {
      toast({
        title: "Using Default Weights",
        description: "Entity scores will use the standard algorithm",
      });
    }

    // Automatically hide the info alert after weights are saved
    setShowWeightsInfo(false);
    // Hide the weights panel after saving
    setShowCustomWeights(false);
  };

  const toggleCustomWeights = () => {
    setShowCustomWeights(!showCustomWeights);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-12 w-full mb-4" />
        </div>
        
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Entity Not Found</AlertTitle>
          <AlertDescription>
            We couldn't find the entity you're looking for. Please try searching again.
          </AlertDescription>
          <Button 
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Return to Search
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>
      </div>
      
      {showWeightsInfo && (
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
            onClick={() => setShowWeightsInfo(false)}
          >
            Got it
          </Button>
        </Alert>
      )}
      
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
              entityType={entity.type} 
              onSaveWeights={handleSaveWeights}
              savedWeights={customWeights}
            />
          </div>
        )}
      </div>
      
      <Tabs defaultValue="details" className="w-full max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          {entity.type === 'creator' && (
            <TabsTrigger value="transparency">Transparency</TabsTrigger>
          )}
          <TabsTrigger value="scoring">Scoring Methodology</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <EntityCard {...entity} />
        </TabsContent>
        
        {entity.type === 'creator' && (
          <TabsContent value="transparency" className="space-y-6">
            <CreatorTransparency entity={entity} />
          </TabsContent>
        )}
        
        <TabsContent value="scoring" className="space-y-6">
          <ScoringExplanation entityType={entity.type} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EntityDetail;
