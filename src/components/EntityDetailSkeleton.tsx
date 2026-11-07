import { useNavigate } from 'react-router-dom';

export const EntityDetailSkeleton = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8 px-4 font-mono space-y-6">
      <button 
        type="button"
        onClick={() => navigate('/')}
        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none"
      >
        <span>&lt;--</span>
        <span>RETURN TO SEARCH</span>
      </button>
      
      <div className="dossier-card p-8 space-y-4 animate-pulse">
        <div className="h-4 bg-secondary/80 w-1/4"></div>
        <div className="h-8 bg-secondary w-1/2"></div>
        <div className="h-4 bg-secondary/60 w-3/4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <div className="h-14 bg-secondary/50"></div>
          <div className="h-14 bg-secondary/50"></div>
          <div className="h-14 bg-secondary/50"></div>
          <div className="h-14 bg-secondary/50"></div>
        </div>
      </div>
    </div>
  );
};
