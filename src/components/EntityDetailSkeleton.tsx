
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EntityDetailSkeleton = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>
      </div>
      
      <div className="mb-6">
        <Skeleton className="h-12 w-full mb-4" />
      </div>
      
      <div className="max-w-5xl mx-auto">
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  );
};
