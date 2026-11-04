
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { TopRatedEntities } from '@/components/TopRatedEntities';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { EntityData } from '@/services/ethicalDataService';
import { getGeminiApiKey, searchWithGemini, reportGeminiError } from '@/services/geminiService';
import { rankEntitiesHybrid, type SemanticScoredEntity } from '@/services/semanticSearchService';
import { performFallbackSearch } from '@/services/localSearch';
import { mockEthicalData } from '@/data/mockEthicalData';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building, User } from 'lucide-react';

const Index = () => {
  const [searchResults, setSearchResults] = useState<EntityData[]>([]);
  const [similarities, setSimilarities] = useState<Record<string, number>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'creators'>('all');
  const { toast } = useToast();

  const commitResults = (
    results: EntityData[],
    notice: string | null,
    sims: SemanticScoredEntity[] = [],
  ) => {
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    sessionStorage.setItem('lastSearchResults', JSON.stringify(results));
    setSearchResults(results);
    setSimilarities(
      Object.fromEntries(sims.map((s) => [s.entity.id, s.similarity])),
    );
    setFallbackNotice(notice);
    setHasSearched(true);
  };

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
      setFallbackNotice(null);
      setSimilarities({});

      // 1) Gemini runs only when the user opted in with their own key.
      if (getGeminiApiKey()) {
        setSearchStatus('Asking Gemini through your saved key…');
        try {
          const geminiResults = await searchWithGemini(query);
          if (Array.isArray(geminiResults) && geminiResults.length > 0) {
            commitResults(geminiResults, null);
            return;
          }
        } catch (error) {
          // Report the failure honestly, then continue down the local chain.
          reportGeminiError(error);
        }
      }

      // 2) On-device semantic search: a real MiniLM embedding model ranks the
      //    catalog in the browser. No key, no server.
      setSearchStatus('Embedding your query on-device…');
      try {
        const ranked = await rankEntitiesHybrid(query, mockEthicalData);
        if (ranked.length > 0) {
          commitResults(
            ranked.map((entry) => entry.entity),
            'Ranked by an on-device semantic model blended with keyword matching.',
            ranked,
          );
          return;
        }
      } catch (error) {
        console.error('Semantic search failed, falling back to string matching:', error);
      }

      // 3) String-based fallback if the model could not load or matched nothing.
      setSearchStatus('Falling back to keyword matching…');
      const results = performFallbackSearch(query);
      if (results.length > 0) {
        commitResults(results, 'Matched by keyword search because the on-device model was unavailable or found no hit.');
      } else {
        commitResults([], 'No matches found — the catalog contains only sample entities.');
      }
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
      setSearchStatus(null);
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
        <SearchHero onSearch={handleSearch} isSearching={isSearching} searchStatus={searchStatus} />
        
        {!hasSearched && (
          <TopRatedEntities />
        )}
        
        {hasSearched && (
          <>
            {fallbackNotice && (
              <div className="w-full max-w-6xl mx-auto px-4 mb-4">
                <p className="text-amber-500 text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                  {fallbackNotice}
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
                  <SearchResults results={filteredResults()} similarities={similarities} />
                </TabsContent>
                
                <TabsContent value="companies">
                  <SearchResults results={filteredResults()} similarities={similarities} />
                </TabsContent>
                
                <TabsContent value="creators">
                  <SearchResults results={filteredResults()} similarities={similarities} />
                </TabsContent>
              </Tabs>
            </div>
            
            <ApiKeyInput />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
