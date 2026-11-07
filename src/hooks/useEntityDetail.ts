import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { mockEthicalData } from '@/data/mockEthicalData';
import { fetchEntityByName } from '@/services/ethicalDataService';
import { loadEvidenceSnapshot, type EvidenceSnapshot } from '@/services/evidenceStore';

export const useEntityDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState<any>(null);
  const [evidence, setEvidence] = useState<EvidenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        setLoading(true);
        
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
        
        console.log("Looking for entity with ID:", id);
        
        // First, try to find entity from sessionStorage (where search results are stored)
        const searchResultsJson = sessionStorage.getItem('lastSearchResults');
        if (searchResultsJson) {
          try {
            const searchResults = JSON.parse(searchResultsJson);
            console.log("Checking saved search results:", searchResults.map((e: any) => ({ id: e.id, name: e.name })));
            
            const matchFromSearchResults = searchResults.find((e: any) => String(e.id) === String(id));
            if (matchFromSearchResults) {
              console.log("Entity found in search results:", matchFromSearchResults.name);
              setEntity(matchFromSearchResults);
              setLoading(false);
              return;
            } else {
              console.log("Entity not found in search results, trying other sources");
            }
          } catch (error) {
            console.error("Error parsing search results from session storage:", error);
          }
        }
        
        // If not found in session storage, try mock data
        console.log("Checking mock data for entity...");
        const foundInMockData = mockEthicalData.find(e => String(e.id) === String(id));
        
        if (foundInMockData) {
          console.log("Entity found in mock data:", foundInMockData.name);
          setEntity(foundInMockData);
        } else {
          // If not found in mock data, try API
          console.log("Entity not found in mock data, trying API fetch");
          
          try {
            const searchResults = await fetchEntityByName(id);
            console.log("API search results:", searchResults?.map(e => ({ id: e.id, name: e.name })));
            
            const matchingEntity = searchResults?.find(e => String(e.id) === String(id));
            
            if (matchingEntity) {
              console.log("Entity found via API:", matchingEntity.name);
              setEntity(matchingEntity);
            } else {
              throw new Error("Entity not found in any data source");
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
    setEvidence(loadEvidenceSnapshot(id));
  }, [id, navigate, toast]);

  return {
    entity,
    evidence,
    loading
  };
};
