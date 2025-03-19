
import { toast } from "@/components/ui/use-toast";
import { EntityData } from '@/types/entityTypes';
import { mockEthicalData } from '@/data/mockEthicalData';
import { fetchFromApi } from './apiService';

// Re-export the mock data and types for backward compatibility
export { mockEthicalData } from '@/data/mockEthicalData';
export type { 
  Controversy, 
  Disclosure, 
  Sponsorship, 
  CharitableWork, 
  EntityData 
} from '@/types/entityTypes';

export const fetchEntityByName = async (name: string): Promise<EntityData[]> => {
  try {
    // Try to fetch from the real API first
    const apiResults = await fetchFromApi(name);
    
    // If we got results from the API, return them
    if (apiResults && apiResults.length > 0) {
      return apiResults;
    }
    
    // If API call fails or returns no results, use mock data as fallback
    console.log("Using fallback mock data");
    const fallbackResults = mockEthicalData.filter(entity => 
      entity.name.toLowerCase().includes(name.toLowerCase()) ||
      entity.description.toLowerCase().includes(name.toLowerCase()) ||
      entity.categories.some(cat => cat.toLowerCase().includes(name.toLowerCase()))
    );
    
    console.log(`Found ${fallbackResults.length} fallback results`);
    
    // If we found matching fallback results, return them
    if (fallbackResults.length > 0) {
      return fallbackResults;
    }
    
    // If no matching fallback results, return the first few mock entities
    return mockEthicalData.slice(0, 3);
    
  } catch (error) {
    console.error("Error fetching entity data:", error);
    toast({
      title: "Error fetching real data",
      description: "Falling back to sample data",
      variant: "destructive",
    });
    
    // Return filtered mock data if real API fails
    const fallbackResults = mockEthicalData.filter(entity => 
      entity.name.toLowerCase().includes(name.toLowerCase()) ||
      entity.description.toLowerCase().includes(name.toLowerCase()) ||
      entity.categories.some(cat => cat.toLowerCase().includes(name.toLowerCase()))
    );
    
    return fallbackResults.length > 0 ? fallbackResults : mockEthicalData.slice(0, 3);
  }
};
