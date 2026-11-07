import { useNavigate } from 'react-router-dom';

export const EntityNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 font-mono">
      <button 
        type="button"
        onClick={() => navigate('/')}
        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mb-8 focus:outline-none"
      >
        <span>&lt;--</span>
        <span>RETURN TO SEARCH</span>
      </button>

      <div className="dossier-card p-6 space-y-4">
        <div className="docket-strip -mx-6 -mt-6 mb-4">
          <span>RECORD NOT FOUND IN REGISTRY</span>
          <span>[ERR 404]</span>
        </div>
        <h1 className="text-lg font-bold text-foreground">
          No matching entity found in public records
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Searched Wikidata, Wikipedia, and session evidence cache. No verified primary item found.
          Verify identifier formatting (e.g. Q95) or corporate spelling.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-terminal px-4 py-2 text-xs"
        >
          [NEW SEARCH]
        </button>
      </div>
    </div>
  );
};
