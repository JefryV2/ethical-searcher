
import { EntityData } from './ethicalDataService';
import { toast } from "@/components/ui/use-toast";

// Store API key in memory (not localStorage for security reasons)
let apiKey: string | null = null;

export const setGeminiApiKey = (key: string) => {
  apiKey = key;
};

export const getGeminiApiKey = () => {
  return apiKey;
};

export const searchWithGemini = async (query: string, data: EntityData[] = []): Promise<EntityData[]> => {
  if (!apiKey) {
    throw new Error("Gemini API key not set");
  }

  try {
    // Import mock data from our ethicalDataService for now
    // In a real implementation with a full backend, this would come from the API
    const { mockEthicalData } = await import('./ethicalDataService').then(module => ({ 
      mockEthicalData: (module as any).mockEthicalData 
    }));
    
    // Enhanced prompt that explicitly asks the model to think more broadly
    const prompt = `Given the search query "${query}", find the most relevant companies or creators from the following ethical business data. 
    Be very generous with matches - consider partial matches in names, descriptions, and categories.
    Look for connections between the query and companies/creators, especially regarding:
    - Environmental impact
    - Labor practices
    - Social responsibility
    - Corporate governance
    - Sustainability initiatives
    - Historical controversies
    - Ethical certifications
    
    Return the IDs of ALL potentially relevant results as a JSON array of strings.
    Format your response ONLY as a JSON array like: ["1", "2", "3"] with no other text.
    
    Here's the data: ${JSON.stringify(mockEthicalData)}`;

    console.log("Sending search request to Gemini API with query:", query);
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.6, // Slightly increased to make matching more generous
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error details:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Full Gemini API response:", JSON.stringify(responseData, null, 2));
    
    // Extract the text from the response
    const text = responseData.candidates[0].content.parts[0].text;
    console.log("Gemini response text:", text);
    
    // Try to parse the response as a JSON array of IDs
    let ids: string[] = [];
    try {
      // First attempt: Look for JSON array pattern in the response
      const match = text.match(/\[.*?\]/s);
      if (match) {
        ids = JSON.parse(match[0]);
        console.log("Successfully parsed JSON array:", ids);
      } else {
        // Second attempt: Split by commas if it's just a comma-separated list
        ids = text.split(',').map(id => id.trim().replace(/"/g, ''));
        console.log("Parsed comma-separated list:", ids);
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      // Fallback: Simple text parsing - look for IDs in the text
      const idMatches = text.match(/['"]?\d+['"]?/g);
      ids = idMatches?.map(id => id.replace(/['"]/g, '')) || [];
      console.log("Extracted IDs using fallback method:", ids);
    }
    
    // Filter the data to only include items with IDs in the response
    let filteredResults = mockEthicalData.filter(item => ids.includes(item.id));
    console.log("Filtered results based on IDs:", filteredResults);
    
    // If no results found after parsing, use improved fallback search
    if (filteredResults.length === 0) {
      console.log("No results found from Gemini API, using enhanced fallback search");
      filteredResults = performFallbackSearch(query, mockEthicalData);
    }
    
    return filteredResults;
  } catch (error) {
    console.error("Error in Gemini search:", error);
    toast({
      title: "Gemini search error",
      description: error instanceof Error ? error.message : "Failed to search with AI",
      variant: "destructive",
    });
    return [];
  }
};

// Improved fallback search function with better matching logic
function performFallbackSearch(query: string, data: EntityData[]): EntityData[] {
  console.log("Performing fallback search with query:", query);
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  // First try direct name matching
  const directNameMatches = data.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );
  
  if (directNameMatches.length > 0) {
    console.log("Found direct name matches:", directNameMatches.length);
    return directNameMatches;
  }
  
  // Score each result based on how well it matches the search terms
  const scoredResults = data.map(item => {
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
