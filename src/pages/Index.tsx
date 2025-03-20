
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { TopRatedEntities } from '@/components/TopRatedEntities';
import { fetchEntityByName, EntityData, mockEthicalData } from '@/services/ethicalDataService';
import { searchWithGemini, getGeminiApiKey, performFallbackSearch } from '@/services/geminiService';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building, User } from 'lucide-react';

const Index = () => {
  const [searchResults, setSearchResults] = useState<EntityData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'creators'>('all');
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
      setIsUsingFallbackData(false);
      console.log("Starting search with query:", query);
      
      // Try Gemini API first if key is set
      if (getGeminiApiKey()) {
        try {
          console.log("Using Gemini for search");
          const geminiResults = await searchWithGemini(query);
          
          if (Array.isArray(geminiResults) && geminiResults.length > 0) {
            console.log(`Gemini search found ${geminiResults.length} results`);
            setSearchResults(geminiResults);
            setHasSearched(true);
            setIsSearching(false);
            return;
          }
        } catch (error) {
          console.error("Gemini search error:", error);
          // Continue to fallback methods
        }
      }
      
      // If Gemini failed or no key, try fallback search method
      console.log("Using entity search fallback");
      const results = await fetchEntityByName(query);
      
      if (results.length > 0) {
        console.log(`Found ${results.length} matches for "${query}"`);
        setSearchResults(results);
        
        // Check if we're using mock data
        const isUsingMock = results.every(item => 
          mockEthicalData.some(mockItem => mockItem.id === item.id)
        );
        
        setIsUsingFallbackData(isUsingMock);
        
        if (isUsingMock) {
          toast({
            title: "Using sample data",
            description: "Connect Gemini API for better results",
            variant: "default",
          });
        }
      } else {
        // No results, show empty state
        setSearchResults([]);
        setIsUsingFallbackData(true);
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

  // Filter results based on active tab
  const filteredResults = () => {
    if (activeTab === 'all') return searchResults;
    if (activeTab === 'companies') return searchResults.filter(item => item.type === 'company');
    if (activeTab === 'creators') return searchResults.filter(item => item.type === 'creator');
    return searchResults;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <main className="container mx-auto">
        <ApiKeyInput />
        <SearchHero onSearch={handleSearch} isSearching={isSearching} />
        
        {!hasSearched && (
          <TopRatedEntities />
        )}
        
        {hasSearched && (
          <>
            {isUsingFallbackData && (
              <div className="w-full max-w-6xl mx-auto px-4 mb-4">
                <p className="text-amber-500 text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                  Currently showing sample data. Connect Gemini API for better results.
                </p>
              </div>
            )}
            
            <div className="w-full max-w-6xl mx-auto px-4">
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'all' | 'companies' | 'creators')}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Results</TabsTrigger>
                  <TabsTrigger value="companies" className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>Companies</span>
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Content Creators</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <SearchResults results={filteredResults()} />
                </TabsContent>
                
                <TabsContent value="companies">
                  <SearchResults results={filteredResults()} />
                </TabsContent>
                
                <TabsContent value="creators">
                  <SearchResults results={filteredResults()} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
