
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { ExampleQueries } from '@/components/ExampleQueries';
import { EntityData } from '@/services/ethicalDataService';
import { lookupEntities, type BuiltEntity } from '@/services/lookupService';
import { saveEvidenceSnapshots } from '@/services/evidenceStore';
import { scoreQueryMatch } from '@/services/disambiguation';
import { performFallbackSearch } from '@/services/localSearch';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';

const Index = () => {
  const [searchResults, setSearchResults] = useState<EntityData[]>([]);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, BuiltEntity>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [failedNotice, setFailedNotice] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'creators'>('all');
  const [lastQuery, setLastQuery] = useState('');
  const [matchScores, setMatchScores] = useState<Record<string, number> | null>(null);
  const [ranking, setRanking] = useState(false);
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
      setMatchScores(null);
      setLastQuery(query);

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

  // Explicit on-device ranking: the button makes the one-time model download
  // a user choice, and the resulting percentages are shown on each card.
  const rankByMeaning = async () => {
    if (searchResults.length < 2 || !lastQuery.trim()) return;
    setRanking(true);
    try {
      setMatchScores(await scoreQueryMatch(lastQuery, searchResults));
    } catch (error) {
      console.error('Semantic ranking failed:', error);
      toast({
        title: 'Ranking unavailable',
        description: 'The on-device embedding model could not load in this browser.',
        variant: 'destructive',
      });
    } finally {
      setRanking(false);
    }
  };

  return (
    <div className="bg-background pb-12">
      <main className="container mx-auto">
        <SearchHero onSearch={handleSearch} isSearching={isSearching} searchStatus={searchStatus} />
        
        {!hasSearched && (
          <ExampleQueries onSearch={handleSearch} isSearching={isSearching} />
        )}
        
        {hasSearched && (
          <>
            {failedNotice && (
              <div className="w-full max-w-6xl mx-auto px-4 mb-6">
                <div className="score-mid ds-text-body-sm bg-warning-subtle/70 border border-amber-500/20 p-3.5 rounded-lg flex items-start gap-2.5">
                  <span>{failedNotice}</span>
                </div>
              </div>
            )}

            {searchResults.length > 1 && Object.keys(evidenceMap).length > 0 && (
              <div className="w-full max-w-6xl mx-auto px-4 mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void rankByMeaning()}
                  disabled={ranking}
                  className="btn-terminal px-3 h-8 text-xs flex items-center gap-1.5"
                >
                  {ranking ? '[CALCULATING EMBEDDINGS...]' : matchScores ? '[RE-RANK BY MEANING]' : '[SEMANTIC RE-RANK]'}
                </button>
                <span className="text-xs text-muted-foreground">
                  {matchScores
                    ? 'Ordered by on-device cosine similarity to your search query.'
                    : 'Optionally loads the 23 MB MiniLM model once to re-rank results by semantic meaning on your device.'}
                </span>
              </div>
            )}
            
            <div className="w-full max-w-6xl mx-auto px-4">
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'all' | 'companies' | 'creators')}
                className="mb-6"
              >
                {/* Terminal-style filter strip */}
                <TabsList className="flex h-auto bg-transparent p-0 rounded-none border-b border-border mb-6 w-full justify-start gap-0">
                  {[
                    { value: 'all',       label: `all (${searchResults.length})` },
                    { value: 'companies', label: `companies (${searchResults.filter(i => i.type === 'company').length})` },
                    { value: 'creators',  label: `creators (${searchResults.filter(i => i.type === 'creator').length})` },
                  ].map(({ value, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="
                        h-9 px-4 rounded-none border-0 border-b-2 border-transparent shrink-0
                        font-mono text-xs text-muted-foreground -mb-px
                        data-[state=active]:text-primary data-[state=active]:border-primary
                        data-[state=active]:bg-transparent data-[state=active]:shadow-none
                        hover:text-foreground transition-colors
                      "
                    >
                      ./{label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="all">
                  <SearchResults
                    results={filteredResults()}
                    evidenceMap={evidenceMap}
                    similarities={matchScores ?? undefined}
                  />
                </TabsContent>
                
                <TabsContent value="companies">
                  <SearchResults
                    results={filteredResults()}
                    evidenceMap={evidenceMap}
                    similarities={matchScores ?? undefined}
                  />
                </TabsContent>
                
                <TabsContent value="creators">
                  <SearchResults
                    results={filteredResults()}
                    evidenceMap={evidenceMap}
                    similarities={matchScores ?? undefined}
                  />
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
