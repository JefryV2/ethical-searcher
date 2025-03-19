
import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { EntityData, mockEthicalData } from '@/services/ethicalDataService';
import { EntityCard } from '@/components/EntityCard';
import { Star, Award, Trophy, Info, SlidersHorizontal } from 'lucide-react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export const TopRatedEntities = () => {
  const [customWeightsActive, setCustomWeightsActive] = useState(false);
  
  // Check if custom weights are being used
  useEffect(() => {
    const savedWeights = localStorage.getItem('customEthicalWeights');
    if (savedWeights && Object.keys(JSON.parse(savedWeights)).length > 0) {
      setCustomWeightsActive(true);
    } else {
      setCustomWeightsActive(false);
    }
  }, []);
  
  // Get top 5 companies and creators by score
  const topCompanies = [...mockEthicalData]
    .filter(entity => entity.type === 'company')
    .sort((a, b) => b.ethicalScore - a.ethicalScore)
    .slice(0, 5);
    
  const topCreators = [...mockEthicalData]
    .filter(entity => entity.type === 'creator')
    .sort((a, b) => b.ethicalScore - a.ethicalScore)
    .slice(0, 5);

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 fade-in-element">
      {customWeightsActive && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-1 px-3">
            <SlidersHorizontal className="w-3 h-3 mr-1" />
            Using Personalized Scoring
          </Badge>
          <span className="text-sm text-muted-foreground">
            Entities are scored based on your custom ethical priorities
          </span>
        </div>
      )}
      
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-bold">Top Ethical Companies</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Companies are scored on Environmental Impact (30%), Social Responsibility (30%), 
                Governance (25%), and Innovation & Impact (15%)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Carousel className="w-full">
          <CarouselContent>
            {topCompanies.map((company) => (
              <CarouselItem key={company.id} className="md:basis-1/2 lg:basis-1/3">
                <Link 
                  to={`/entity/${company.id}`} 
                  className="block h-full"
                  onClick={() => console.log("Clicked top company with ID:", company.id, "Name:", company.name)}
                >
                  <div className="h-full">
                    <EntityCard {...company} />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-4">
            <CarouselPrevious className="relative inset-auto -left-0 translate-y-0" />
            <CarouselNext className="relative inset-auto -right-0 translate-y-0" />
          </div>
        </Carousel>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Star className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-bold">Top Ethical Content Creators</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Creators are scored on Transparency (35%), Content Integrity (25%), 
                Social Impact (20%), Environmental Advocacy (10%), and Audience Responsibility (10%)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Carousel className="w-full">
          <CarouselContent>
            {topCreators.map((creator) => (
              <CarouselItem key={creator.id} className="md:basis-1/2 lg:basis-1/3">
                <Link 
                  to={`/entity/${creator.id}`} 
                  className="block h-full"
                  onClick={() => console.log("Clicked top creator with ID:", creator.id, "Name:", creator.name)}
                >
                  <div className="h-full">
                    <EntityCard {...creator} />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-4">
            <CarouselPrevious className="relative inset-auto -left-0 translate-y-0" />
            <CarouselNext className="relative inset-auto -right-0 translate-y-0" />
          </div>
        </Carousel>
      </div>
    </div>
  );
};
