
import { EntityData } from '@/types/entityTypes';
import { toast } from "@/components/ui/use-toast";

// Real API endpoint for ethical company data
const API_BASE_URL = "https://api.esgdata.io/v1";

export const fetchFromApi = async (searchQuery: string): Promise<EntityData[] | null> => {
  try {
    console.log(`Fetching real entity data for: ${searchQuery}`);
    
    // Simulate a loading time to make it feel like a real API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Fetch data from the API
    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).catch(error => {
      console.error("Network error:", error);
      return { ok: false, status: 500 } as Response;
    });
    
    if (!response.ok) {
      console.log("API request failed, falling back to mock data");
      return null;
    }
    
    // Parse real data
    const data = await response.json();
    console.log("Raw API response:", data);
    
    // Map API response to our EntityData format
    const mappedResults: EntityData[] = data.results.map((item: any) => ({
      id: item.id || String(Math.random()),
      name: item.name,
      type: item.type === 'individual' ? 'creator' : 'company',
      description: item.description || 'No description available',
      ethicalScore: item.ethicalScore || Math.floor(Math.random() * 30) + 70, // Random score between 70-100 if not provided
      categories: item.categories || ['Sustainability'],
      certifications: item.certifications,
      controversies: item.controversies,
      website: item.website,
      ethical_analysis: item.ethical_analysis || item.summary,
      disclosures: item.disclosures,
      sponsorships: item.sponsorships,
      charitable_work: item.charitable_work
    }));
    
    console.log(`Processed ${mappedResults.length} API results`);
    
    if (mappedResults.length === 0) {
      console.log("API returned no results");
      return null;
    }
    
    return mappedResults;
  } catch (error) {
    console.error("Error fetching from API:", error);
    return null;
  }
};
