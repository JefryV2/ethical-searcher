
import { useState } from 'react';
import { SearchHero } from '@/components/SearchHero';
import { SearchResults } from '@/components/SearchResults';

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

  const handleSearch = (query: string) => {
    // For now, just filter the mock data
    const filtered = mockResults.filter(result => 
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <main className="container mx-auto">
        <SearchHero onSearch={handleSearch} />
        <SearchResults results={searchResults} />
      </main>
    </div>
  );
};

export default Index;
