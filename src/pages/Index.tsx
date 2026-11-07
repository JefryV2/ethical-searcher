
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { ExampleQueries } from '@/components/ExampleQueries';
import { EntityData } from '@/services/ethicalDataService';
import { lookupEntities, type BuiltEntity } from '@/services/lookupService';
import { saveEvidenceSnapshots } from '@/services/evidenceStore';
import { performFallbackSearch } from '@/services/localSearch';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building, User } from 'lucide-react';

const Index = () => {
  const [searchResults, setSearchResults] = useState<EntityData[]>([]);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, BuiltEntity>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [failedNotice, setFailedNotice] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'creators'>('all');
  const { toast } = useToast();

  const commit = (
    results: EntityData[],
    notice: string | null,
    built: BuiltEntity[] = [],
  ) => {
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    sessionStorage.setItem('lastSearchResults', JSON.stringify(results));
    saveEvidenceSnapshots(built);
    setSearchResults(results);
    setEvidenceMap(Object.fromEntries(built.map((b) => [b.entity.id, b])));
    setFailedNotice(notice);
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
      setFailedNotice(null);
      setEvidenceMap({});

      // 1) Live source lookup: Wikidata identity -> Wikipedia summary ->
      //    scrape the official site. No keys, no accounts; every hit keeps
      //    the URL it came from.
      setSearchStatus('Resolving in Wikidata…');
      let built: BuiltEntity[] = [];
      try {
        built = await lookupEntities(query, { maxEntities: 3 });
      } catch (error) {
        console.error('Source lookup failed:', error);
      }

      if (built.length === 0) {
        // 2) Nothing in public sources: fall back to the curated sample
        //    catalog and say so rather than inventing a result.
        setSearchStatus('No public record found — checking the sample catalog…');
        const results = performFallbackSearch(query);
        if (results.length > 0) {
          commit(
            results,
            'Sample catalog match from keyword search. Search a named company or creator to pull live sources instead.',
          );
        } else {
          commit(
            [],
            `No public record found for "${query}" — Wikidata returned nothing and the sample catalog has no match.`,
          );
        }
        return;
      }

      const entities = built.map((b) => b.entity);
      const reachableSites = built.filter((b) => b.siteAudit.reachable > 0).length;
      commit(
        entities,
        `Live record — ${reachableSites}/${built.length} official site${built.length > 1 ? 's' : ''} read, plus Wikidata and Wikipedia. The score reflects how much evidence was found publicly, not a verdict.`,
        built,
      );
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
    <div className="min-h-svh bg-background">
      <main className="container mx-auto">
        <SearchHero onSearch={handleSearch} isSearching={isSearching} searchStatus={searchStatus} />
        
        {!hasSearched && (
          <ExampleQueries onSearch={handleSearch} isSearching={isSearching} />
        )}
        
        {hasSearched && (
          <>
            {failedNotice && (
              <div className="w-full max-w-6xl mx-auto px-4 mb-4">
                <p className="score-mid ds-text-body-sm bg-warning-subtle p-2 rounded-md">
                  {failedNotice}
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
                  <SearchResults results={filteredResults()} evidenceMap={evidenceMap} />
                </TabsContent>
                
                <TabsContent value="companies">
                  <SearchResults results={filteredResults()} evidenceMap={evidenceMap} />
                </TabsContent>
                
                <TabsContent value="creators">
                  <SearchResults results={filteredResults()} evidenceMap={evidenceMap} />
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
