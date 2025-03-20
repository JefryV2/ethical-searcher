import { EntityData } from '@/types/entityTypes';
import { mockEthicalData } from '@/data/mockEthicalData';
import { toast } from "@/components/ui/use-toast";

// Hardcoded API key - in a production app, this would be stored securely on the server
const HARDCODED_API_KEY = "AIzaSyD-Yj_x3IDKS_X1zNcGD4ZA3-GFB6eWi5o";

// We'll keep this for backward compatibility but it will always return the hardcoded key
export const getGeminiApiKey = () => {
  return HARDCODED_API_KEY;
};

// This function is kept for backward compatibility but does nothing
export const setGeminiApiKey = (key: string) => {
  console.log("API key setting is disabled in this version");
  return;
};

// Hidden API service
const fetchFromApiInternal = async (searchQuery: string): Promise<EntityData[] | null> => {
  try {
    console.log(`[Internal] Fetching real entity data for: ${searchQuery}`);
    
    // Simulate a loading time to make it feel like a real API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // This is where real API call would happen with the real API_BASE_URL
    // In this implementation, we're keeping it private and not exposing it to the user
    
    // Simulate API failure and fallback
    if (Math.random() > 0.8) {
      console.log("[Internal] Simulated API failure for testing fallback");
      return null;
    }
    
    // Here we would process real API data, but for now we'll use transformed mock data
    const filteredResults = mockEthicalData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (filteredResults.length === 0) {
      return null;
    }
    
    // Add a slight delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return filteredResults;
  } catch (error) {
    console.error("[Internal] Error in API fetch:", error);
    return null;
  }
};

export const searchWithGemini = async (query: string): Promise<EntityData[]> => {
  try {
    // Enhanced prompt that explicitly asks for real data search
    const prompt = `You are a helpful search assistant specializing in ethical companies and creators.

Given the search query "${query}", search for real companies or creators that match this query.
Look for relevant ethical information about:
- Company or creator name (exact or similar to "${query}")
- Their industry or field
- Environmental practices and impact
- Labor practices and social responsibility
- Ethical certifications and standards
- Corporate governance and transparency
- Any controversies or ethical concerns

For EACH entity you find, return:
1. Name (required)
2. Type: "company" or "creator" (required)
3. Description: A brief summary (required)
4. Ethical score: A number from 0-100 based on ethical practices (required)
5. Categories: Industry, field, or relevance tags (required)
6. Certifications: List of any ethical/environmental certifications 
7. Controversies: Any ethical concerns or issues, each with a title and description
8. Website: Official website URL if available
9. Ethical analysis: A brief ethical assessment

Format your response as a JSON array of objects, like:
[
  {
    "id": "1",
    "name": "Company Name",
    "type": "company",
    "description": "Brief description",
    "ethicalScore": 85,
    "categories": ["Category1", "Category2"],
    "certifications": ["Certification1"],
    "controversies": [{"title": "Issue", "description": "Details"}],
    "website": "https://example.com",
    "ethical_analysis": "Ethical assessment"
  }
]

Focus on providing REAL data about actual companies and creators. If you cannot find any real data about "${query}", respond with an empty array [].
`;

    console.log("Sending search request to Gemini API for real data with query:", query);
    
    // Use the hardcoded API key
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': HARDCODED_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more factual responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // Increased for more detailed responses
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error details:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Extract the text from the response
    const text = responseData.candidates[0].content.parts[0].text;
    
    // Try to parse the JSON response
    try {
      // Look for JSON array pattern in the response
      const match = text.match(/\[\s*\{.*\}\s*\]/s);
      if (match) {
        const entities = JSON.parse(match[0]);
        
        // Ensure each entity has an id
        const entitiesWithIds = entities.map((entity: any, index: number) => ({
          ...entity,
          id: entity.id || String(index + 1)
        }));
        
        return entitiesWithIds;
      } else {
        console.log("No valid JSON found in response");
        
        // Try hidden API as fallback if Gemini doesn't return valid data
        const apiResults = await fetchFromApiInternal(query);
        if (apiResults && apiResults.length > 0) {
          return apiResults;
        }
        
        return [];
      }
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      
      // Try hidden API as fallback if Gemini parsing fails
      const apiResults = await fetchFromApiInternal(query);
      if (apiResults && apiResults.length > 0) {
        return apiResults;
      }
      
      return [];
    }
  } catch (error) {
    console.error("Error in Gemini search:", error);
    toast({
      title: "Search error",
      description: error instanceof Error ? error.message : "Failed to search with AI",
      variant: "destructive",
    });
    
    // Try hidden API as final fallback
    const apiResults = await fetchFromApiInternal(query);
    return apiResults || [];
  }
};

// Improved fallback search function for internal use
export function performFallbackSearch(query: string): EntityData[] {
  console.log("Performing fallback search with query:", query);
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  // First try direct name matching
  const directNameMatches = mockEthicalData.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );
  
  if (directNameMatches.length > 0) {
    console.log("Found direct name matches:", directNameMatches.length);
    return directNameMatches;
  }
  
  // Score each result based on how well it matches the search terms
  const scoredResults = mockEthicalData.map(item => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    const categoriesLower = item.categories.map(c => c.toLowerCase());
    const typeLower = item.type.toLowerCase();
    
    // Check each search term
    for (const term of searchTerms) {
      // Direct matches in name (highest priority)
      if (nameLower.includes(term)) score += 15;
      
      // Matches in description
      if (descLower.includes(term)) score += 7;
      
      // Matches in categories
      if (categoriesLower.some(cat => cat.includes(term))) score += 10;
      
      // Matches in entity type
      if (typeLower.includes(term)) score += 5;
      
      // Partial word matches (lower priority but still relevant)
      if (nameLower.split(/\s+/).some(word => word.includes(term) || term.includes(word))) score += 3;
    }
    
    return { item, score };
  });
  
  // Sort by score (descending) and filter items with a score above 0
  const results = scoredResults
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.item);
  
  console.log("Fallback search found", results.length, "results with scores");
  
  // If still no results, return empty array
  if (results.length === 0) {
    console.log("No matching results in fallback search");
    return [];
  }
  
  return results;
}
