import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="font-ledger-mono text-xs text-muted-foreground uppercase tracking-wider">
          404
        </p>
        <h1 className="font-editorial text-3xl font-medium text-foreground">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This path doesn't exist in the register.
        </p>
        <a
          href="/"
          className="inline-block mt-2 text-sm text-primary hover:underline"
        >
          Return to the register
        </a>
      </div>
    </div>
  );
};

export default NotFound;
