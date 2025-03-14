
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { fetchEntityByName, EntityData, mockEthicalData } from '@/services/ethicalDataService';
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
        try {
          const geminiResults = await searchWithGemini(query, []);
          
          if (Array.isArray(geminiResults) && geminiResults.length > 0) {
            console.log(`Gemini search found ${geminiResults.length} results`);
            setSearchResults(geminiResults);
          } else {
            console.log("No results from Gemini search, using simple fallback");
            // Simple fallback if all else fails
            const simpleResults = performSimpleFallback(query);
            setSearchResults(simpleResults);
            
            if (simpleResults.length === 0) {
              toast({
                title: "No matches found",
                description: "Try searching with different keywords",
                variant: "default",
              });
            }
          }
        } catch (error) {
          console.error("Gemini search error:", error);
          // If Gemini fails, use simple fallback
          const simpleResults = performSimpleFallback(query);
          setSearchResults(simpleResults);
          
          if (simpleResults.length === 0) {
            toast({
              title: "Search error",
              description: "Using basic search instead. Try different keywords.",
              variant: "default",
            });
          }
        }
      } else {
        console.log("No direct matches and no Gemini API key set, using simple fallback");
        // Simple fallback if no API key
        const simpleResults = performSimpleFallback(query);
        setSearchResults(simpleResults);
        
        if (simpleResults.length === 0) {
          toast({
            title: "No matches found",
            description: "Try searching with different keywords or add a Gemini API key for better results",
            variant: "default",
          });
        }
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

  // Super simple fallback search that always returns results
  const performSimpleFallback = (query: string): EntityData[] => {
    console.log("Using simple fallback search");
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // If the query is very short, be more lenient
    if (query.length <= 3) {
      // Just return all results for very short queries
      return mockEthicalData;
    }
    
    const results = mockEthicalData.filter(item => {
      const name = item.name.toLowerCase();
      const desc = item.description.toLowerCase();
      const categories = item.categories.join(' ').toLowerCase();
      
      // Check if any search term exists in the item data
      return searchTerms.some(term => 
        name.includes(term) || 
        desc.includes(term) || 
        categories.includes(term)
      );
    });
    
    // If still no results, return a few items as examples
    if (results.length === 0) {
      return mockEthicalData.slice(0, 3); // Return first 3 items as examples
    }
    
    return results;
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
