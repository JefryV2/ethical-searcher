import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/Navbar";
import { EntityDetailSkeleton } from "@/components/EntityDetailSkeleton";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Code-split EntityDetail route to keep the initial landing bundle fast
const EntityDetail = React.lazy(() => import("./pages/EntityDetail"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/entity/:id"
                  element={
                    <Suspense fallback={<EntityDetailSkeleton />}>
                      <EntityDetail />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <footer className="border-t border-border py-4 font-mono">
              <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <p>
                  <span className="text-primary">TRNSPR</span> — no tracking · no API keys · no ads
                </p>
                <div className="flex items-center gap-4">
                  <a href="https://www.wikidata.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">wikidata.org</a>
                  <a href="https://www.wikipedia.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">wikipedia.org</a>
                  <a href="https://huggingface.co/models" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">huggingface.co</a>
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
