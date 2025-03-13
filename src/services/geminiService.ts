
interface SearchResult {
  id: string;
  name: string;
  type: 'company' | 'creator';
  description: string;
  ethicalScore: number;
  categories: string[];
}

// Store API key in memory (not localStorage for security reasons)
let apiKey: string | null = null;

export const setGeminiApiKey = (key: string) => {
  apiKey = key;
};

export const getGeminiApiKey = () => {
  return apiKey;
};

export const searchWithGemini = async (query: string, data: SearchResult[]): Promise<SearchResult[]> => {
  if (!apiKey) {
    throw new Error("Gemini API key not set");
  }

  try {
    const prompt = `Given the search query "${query}", find the most relevant companies or creators from the following data. Consider names, descriptions, ethical practices, and categories. Return ONLY the IDs of relevant results as a JSON array of strings, nothing else. For example: ["1", "2"]. Here's the data: ${JSON.stringify(data)}`;

    console.log("Sending search request to Gemini API with query:", query);
    
    // Updated API endpoint to use the gemini-2.0-flash model
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
          temperature: 0.2,
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
    const filteredResults = data.filter(item => ids.includes(item.id));
    console.log("Final filtered results:", filteredResults);
    
    // If no results found after parsing, return all results as a fallback
    if (filteredResults.length === 0 && ids.length === 0) {
      console.log("No results found after parsing and no IDs extracted. Using basic text matching as fallback");
      // Simple fallback: Find items that might match the query text
      const lowercaseQuery = query.toLowerCase();
      return data.filter(item => {
        return item.name.toLowerCase().includes(lowercaseQuery) ||
               item.description.toLowerCase().includes(lowercaseQuery) ||
               item.categories.some(cat => cat.toLowerCase().includes(lowercaseQuery));
      });
    }
    
    return filteredResults;
  } catch (error) {
    console.error("Error in Gemini search:", error);
    throw error;
  }
};
