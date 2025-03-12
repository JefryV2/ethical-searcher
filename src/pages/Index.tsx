
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { searchWithAI } from '@/services/aiSearch';
import { searchWithGemini, getGeminiApiKey } from '@/services/geminiService';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { useToast } from "@/components/ui/use-toast";

// Temporary mock data for demonstration
const mockResults = [
  {
    id: '1',
    name: 'Eco Solutions Inc',
    type: 'company' as const,
    description: 'Leading sustainable technology solutions provider with focus on renewable energy.',
    ethicalScore: 8.5,
    categories: ['Environmental', 'Fair Labor', 'Innovation']
  },
  {
    id: '2',
    name: 'Sarah Green',
    type: 'creator' as const,
    description: 'Environmental activist and content creator focusing on sustainable living.',
    ethicalScore: 9.2,
    categories: ['Education', 'Sustainability', 'Community']
  },
  {
    id: '3',
    name: 'Tech Ethics Co',
    type: 'company' as const,
    description: 'Technology company prioritizing ethical AI development and data privacy.',
    ethicalScore: 7.8,
    categories: ['Privacy', 'Innovation', 'Transparency']
  }
];

const Index = () => {
  const [searchResults, setSearchResults] = useState(mockResults);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      
      let results;
      // Use Gemini if API key is set, otherwise fallback to local search
      if (getGeminiApiKey()) {
        results = await searchWithGemini(query, mockResults);
      } else {
        results = await searchWithAI(query, mockResults);
      }
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try searching with different keywords",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <main className="container mx-auto">
        <ApiKeyInput />
        <SearchHero onSearch={handleSearch} isSearching={isSearching} />
        <SearchResults results={searchResults} />
      </main>
    </div>
  );
};

export default Index;
