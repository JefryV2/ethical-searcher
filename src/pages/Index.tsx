import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';
import { searchWithAI } from '@/services/aiSearch';
import { searchWithGemini, getGeminiApiKey } from '@/services/geminiService';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { useToast } from "@/components/ui/use-toast";

// Enhanced mock data with more ethical information
const mockResults = [
  {
    id: '1',
    name: 'Eco Solutions Inc',
    type: 'company' as const,
    description: 'Leading sustainable technology solutions provider with focus on renewable energy.',
    ethicalScore: 85, // Now on a 0-100 scale
    categories: ['Environmental', 'Fair Labor', 'Innovation'],
    certifications: ['B Corp Certified', 'ISO 14001', 'Carbon Neutral'],
    controversies: [
      {
        title: 'Supply Chain Concerns (2019)',
        description: 'Minor controversy regarding raw material suppliers in Southeast Asia.',
        date: '2019-06-15',
        source_url: 'https://example.com/news/ecosolutions-supply'
      }
    ],
    website: 'https://ecosolutions.example.com',
    ethical_analysis: 'Strong environmental practices with industry-leading sustainability initiatives. Working to improve supply chain transparency.'
  },
  {
    id: '2',
    name: 'Sarah Green',
    type: 'creator' as const,
    description: 'Environmental activist and content creator focusing on sustainable living.',
    ethicalScore: 92,
    categories: ['Education', 'Sustainability', 'Community'],
    certifications: ['Climate Reality Leader', 'Sustainable Content Creator Badge'],
    controversies: [],
    website: 'https://sarahgreen.example.com',
    ethical_analysis: 'Consistently promotes ethical practices and transparency in sponsorships. Only partners with verified sustainable brands.'
  },
  {
    id: '3',
    name: 'Tech Ethics Co',
    type: 'company' as const,
    description: 'Technology company prioritizing ethical AI development and data privacy.',
    ethicalScore: 78,
    categories: ['Privacy', 'Innovation', 'Transparency'],
    certifications: ['Fair AI Certification', 'Data Privacy Shield'],
    controversies: [
      {
        title: 'Data Handling Incident',
        description: 'Minor data leak affecting a small number of users, promptly addressed.',
        date: '2021-03-22',
        source_url: 'https://example.com/news/techethics-incident'
      }
    ],
    website: 'https://techethics.example.com',
    ethical_analysis: 'Good data protection practices overall with transparent incident reporting. Continuous improvement in security protocols.'
  }
];

const Index = () => {
  const [searchResults, setSearchResults] = useState<typeof mockResults>([]);
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
      
      let results;
      // Simple name matching for direct company/creator name searches
      const directNameMatch = mockResults.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      
      // If we have a direct name match, prioritize those results
      if (directNameMatch.length > 0) {
        console.log("Found direct name matches:", directNameMatch.length);
        results = directNameMatch;
      } 
      // Otherwise use Gemini or local search
      else if (getGeminiApiKey()) {
        console.log("Using Gemini search");
        results = await searchWithGemini(query, mockResults);
        console.log("Search results from Gemini:", results);
      } else {
        console.log("Using local AI search");
        results = await searchWithAI(query, mockResults);
        console.log("Search results from local AI:", results);
      }
      
      // Ensure results is always an array
      if (!Array.isArray(results)) {
        console.error("Search returned non-array result:", results);
        results = [];
      }
      
      setSearchResults(results);
      setHasSearched(true);
      
      // Only show toast for no results if we got an empty array
      if (results.length === 0) {
        toast({
          title: "No matches found",
          description: "Try searching with different keywords",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      // Reset results to empty array on error
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
