
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { fetchEntityByName, EntityData } from '@/services/ethicalDataService';
import { searchWithGemini, getGeminiApiKey } from '@/services/geminiService';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [searchResults, setSearchResults] = useState<EntityData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term",
        variant: "default",
      });
      return;
    }
    
    try {
      setIsSearching(true);
      console.log("Starting search with query:", query);
      
      // Direct search by name using our data service
      const directResults = await fetchEntityByName(query);
      
      if (directResults.length > 0) {
        console.log(`Found ${directResults.length} direct matches for "${query}"`);
        setSearchResults(directResults);
      } 
      // If no direct matches and Gemini API key is set, try AI-powered search
      else if (getGeminiApiKey()) {
        console.log("No direct matches, trying Gemini search");
        const geminiResults = await searchWithGemini(query, []);
        
        if (Array.isArray(geminiResults) && geminiResults.length > 0) {
          console.log(`Gemini search found ${geminiResults.length} results`);
          setSearchResults(geminiResults);
        } else {
          console.log("No results from Gemini search");
          setSearchResults([]);
          
          toast({
            title: "No matches found",
            description: "Try searching with different keywords",
            variant: "default",
          });
        }
      } else {
        console.log("No direct matches and no Gemini API key set");
        setSearchResults([]);
        
        toast({
          title: "No matches found",
          description: "Try searching with different keywords",
          variant: "default",
        });
      }
      
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <main className="container mx-auto">
        <ApiKeyInput />
        <SearchHero onSearch={handleSearch} isSearching={isSearching} />
        {hasSearched && (
          <SearchResults results={searchResults} />
        )}
      </main>
    </div>
  );
};

export default Index;
