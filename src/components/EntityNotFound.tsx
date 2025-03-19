
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EntityNotFound = () => {
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
      
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Entity Not Found</AlertTitle>
        <AlertDescription>
          We couldn't find the entity you're looking for. Please try searching again.
        </AlertDescription>
        <Button 
          onClick={() => navigate('/')}
          className="mt-4"
        >
          Return to Search
        </Button>
      </Alert>
    </div>
  );
};
