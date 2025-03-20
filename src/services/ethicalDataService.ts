
import { toast } from "@/components/ui/use-toast";
import { EntityData } from '@/types/entityTypes';
import { mockEthicalData } from '@/data/mockEthicalData';
import { performFallbackSearch } from './geminiService';

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
    // Try to find entity by name in mock data
    const matchingEntities = mockEthicalData.filter(entity => 
      entity.name.toLowerCase().includes(name.toLowerCase()) ||
      entity.description.toLowerCase().includes(name.toLowerCase()) ||
      entity.categories.some(cat => cat.toLowerCase().includes(name.toLowerCase()))
    );
    
    console.log(`Found ${matchingEntities.length} potential matches`);
    
    // If we found matching entities, return them
    if (matchingEntities.length > 0) {
      return matchingEntities;
    }
    
    // If no matching entities in mock data, use the fallback search
    console.log("Using fallback search logic");
    const fallbackResults = performFallbackSearch(name);
    
    // If still no results, return the first few mock entities
    if (fallbackResults.length === 0) {
      console.log("No matches found, returning sample entities");
      return mockEthicalData.slice(0, 3);
    }
    
    return fallbackResults;
  } catch (error) {
    console.error("Error fetching entity data:", error);
    toast({
      title: "Error fetching data",
      description: "Falling back to sample data",
      variant: "destructive",
    });
    
    // Return a few sample entities if an error occurs
    return mockEthicalData.slice(0, 3);
  }
};
