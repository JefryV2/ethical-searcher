
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { mockEthicalData } from '@/services/ethicalDataService';

export const useEntityDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [showWeightsInfo, setShowWeightsInfo] = useState(true);
  const [showCustomWeights, setShowCustomWeights] = useState(false);

  // Load saved weights from localStorage
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

  // Fetch entity data
  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from an API using the ID
        // For now, using mock data
        console.log("All available entities:", mockEthicalData.map(e => ({ id: e.id, name: e.name })));
        console.log("Looking for entity with ID:", id);
        
        // Make sure we're doing a strict comparison of string IDs
        const foundEntity = mockEthicalData.find(e => String(e.id) === String(id));
        console.log("Found entity:", foundEntity);
        
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
          console.error("Entity not found with ID:", id);
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

    if (id) {
      fetchEntityData();
    } else {
      console.error("No ID parameter found in URL");
      navigate('/');
    }
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
