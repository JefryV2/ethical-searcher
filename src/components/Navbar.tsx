import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScraperStatusBadge } from "@/components/ScraperStatusBadge";
import { AboutDialog } from "@/components/AboutDialog";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/98 backdrop-blur-none">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Identity — name as a command namespace, not a logo */}
        <Link
          to="/"
          className="group focus:outline-none focus-visible:outline focus-visible:outline-primary"
        >
          <span className="font-mono text-sm font-bold tracking-tight text-primary group-hover:opacity-80 transition-opacity">
            TRNSPR
          </span>
          <span className="font-mono text-xs text-muted-foreground ml-2 hidden sm:inline">
            // public record terminal
          </span>
        </Link>

        {/* Utility strip */}
        <div className="flex items-center gap-3">
          <ScraperStatusBadge />
          <div className="hidden sm:block">
            <AboutDialog />
          </div>
          <span className="text-border">|</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
