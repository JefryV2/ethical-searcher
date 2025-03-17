
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EntityCard } from '@/components/EntityCard';
import { ScoringExplanation } from '@/components/ScoringExplanation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { mockEthicalData } from '@/services/ethicalDataService';
import { useToast } from "@/components/ui/use-toast";

const EntityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from an API using the ID
        // For now, using mock data
        const foundEntity = mockEthicalData.find(e => e.id === id);
        if (foundEntity) {
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
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-lg">Loading entity data...</div>
      </div>
    );
  }

  if (!entity) return null;

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
      
      <Tabs defaultValue="details" className="w-full max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Methodology</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <EntityCard {...entity} />
        </TabsContent>
        
        <TabsContent value="scoring" className="space-y-6">
          <ScoringExplanation entityType={entity.type} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EntityDetail;
