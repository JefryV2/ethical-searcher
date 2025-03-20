
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { mockEthicalData } from '@/data/mockEthicalData';
import { fetchEntityByName } from '@/services/ethicalDataService';

export const useEntityDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [showWeightsInfo, setShowWeightsInfo] = useState(true);
  const [showCustomWeights, setShowCustomWeights] = useState(false);

  useEffect(() => {
    const savedWeights = localStorage.getItem('customEthicalWeights');
    if (savedWeights) {
      try {
        setCustomWeights(JSON.parse(savedWeights));
      } catch (error) {
        console.error("Error parsing saved weights:", error);
        localStorage.removeItem('customEthicalWeights');
      }
    }
  }, []);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        setLoading(true);
        console.log("All available entities:", mockEthicalData.map(e => ({ id: e.id, name: e.name })));
        console.log("Looking for entity with ID:", id);
        
        // Check if ID exists
        if (!id) {
          console.error("No ID parameter found in URL");
          toast({
            title: "Entity not found",
            description: "Missing entity identifier",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        // Try to find the entity directly from mockEthicalData first
        const foundEntity = mockEthicalData.find(e => String(e.id) === String(id));
        
        if (foundEntity) {
          console.log("Entity found in mock data:", foundEntity.name);
          setEntity(foundEntity);
        } else {
          // If not found in mock data, try searching by ID (could be from API)
          console.log("Entity not found in mock data, trying to fetch it");
          
          try {
            const searchResults = await fetchEntityByName(id);
            const matchingEntity = searchResults?.find(e => String(e.id) === String(id));
            
            if (matchingEntity) {
              console.log("Entity found via API:", matchingEntity.name);
              setEntity(matchingEntity);
            } else {
              throw new Error("Entity not found");
            }
          } catch (error) {
            console.error("Error searching for entity:", error);
            toast({
              title: "Entity not found",
              description: "We couldn't find that company or creator",
              variant: "destructive",
            });
            navigate('/');
          }
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
  }, [id, navigate, toast]);

  const handleSaveWeights = (weights: Record<string, number>) => {
    setCustomWeights(weights);
    localStorage.setItem('customEthicalWeights', JSON.stringify(weights));
    
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

    setShowWeightsInfo(false);
    setShowCustomWeights(false);
  };

  const toggleCustomWeights = () => {
    setShowCustomWeights(!showCustomWeights);
  };

  return {
    entity,
    loading,
    customWeights,
    showWeightsInfo,
    showCustomWeights,
    setShowWeightsInfo,
    toggleCustomWeights,
    handleSaveWeights
  };
};
