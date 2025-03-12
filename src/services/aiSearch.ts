
interface SearchResult {
  id: string;
  name: string;
  type: 'company' | 'creator';
  description: string;
  ethicalScore: number;
  categories: string[];
}

export const searchWithAI = async (query: string, data: SearchResult[]): Promise<SearchResult[]> => {
  try {
    // Create a prompt that explains what we want to achieve
    const searchPrompt = `Given the search query "${query}", find the most relevant companies or creators from the following data. Consider names, descriptions, and categories. Return only the IDs of relevant results, separated by commas. Here's the data:

    ${JSON.stringify(data, null, 2)}`;

    // For now we'll use a simplified matching logic until we connect to a real AI service
    const lowercaseQuery = query.toLowerCase();
    return data.filter(item => {
      const relevanceScore = calculateRelevance(item, lowercaseQuery);
      return relevanceScore > 0.3; // Threshold for relevance
    });
  } catch (error) {
    console.error('Error in AI search:', error);
    return [];
  }
};

// Helper function to calculate relevance score
const calculateRelevance = (item: SearchResult, query: string): number => {
  const nameMatch = item.name.toLowerCase().includes(query) ? 0.5 : 0;
  const descMatch = item.description.toLowerCase().includes(query) ? 0.3 : 0;
  const categoryMatch = item.categories.some(cat => 
    cat.toLowerCase().includes(query)
  ) ? 0.2 : 0;

  return nameMatch + descMatch + categoryMatch;
};
