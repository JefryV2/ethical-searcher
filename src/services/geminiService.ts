
import { EntityData, mockEthicalData } from './ethicalDataService';
import { toast } from "@/components/ui/use-toast";

// Store API key in memory (not localStorage for security reasons)
let apiKey: string | null = null;

export const setGeminiApiKey = (key: string) => {
  apiKey = key;
};

export const getGeminiApiKey = () => {
  return apiKey;
};

export const searchWithGemini = async (query: string): Promise<EntityData[]> => {
  if (!apiKey) {
    throw new Error("Gemini API key not set");
  }

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
    console.log("Full Gemini API response:", JSON.stringify(responseData, null, 2));
    
    // Extract the text from the response
    const text = responseData.candidates[0].content.parts[0].text;
    console.log("Gemini response text:", text);
    
    // Try to parse the JSON response
    try {
      // Look for JSON array pattern in the response
      const match = text.match(/\[\s*\{.*\}\s*\]/s);
      if (match) {
        const entities = JSON.parse(match[0]);
        console.log("Successfully parsed JSON array of entities:", entities);
        
        // Ensure each entity has an id
        const entitiesWithIds = entities.map((entity: any, index: number) => ({
          ...entity,
          id: entity.id || String(index + 1)
        }));
        
        return entitiesWithIds;
      } else {
        console.log("No valid JSON found in response");
        return [];
      }
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      return [];
    }
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

// Improved fallback search function if needed
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
