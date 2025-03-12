
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
    const prompt = `Given the search query "${query}", find the most relevant companies or creators from the following data. Consider names, descriptions, ethical practices, and categories. Return ONLY the IDs of relevant results as a JSON array of strings, nothing else. Here's the data: ${JSON.stringify(data)}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Extract the text from the response
    const text = responseData.candidates[0].content.parts[0].text;
    
    // Try to parse the response as a JSON array of IDs
    let ids: string[] = [];
    try {
      // Look for JSON array pattern in the response
      const match = text.match(/\[.*?\]/s);
      if (match) {
        ids = JSON.parse(match[0]);
      } else {
        // Fallback: split by commas if it's just a comma-separated list
        ids = text.split(',').map(id => id.trim().replace(/"/g, ''));
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      // Fallback to simple text parsing - look for IDs in the text
      ids = text.match(/['"]?\d+['"]?/g)?.map(id => id.replace(/['"]/g, '')) || [];
    }
    
    // Filter the data to only include items with IDs in the response
    return data.filter(item => ids.includes(item.id));
  } catch (error) {
    console.error("Error in Gemini search:", error);
    throw error;
  }
};
