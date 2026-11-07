import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  checkScraperBackend,
  getLocalReaderUrl,
  setLocalReaderUrl,
  DEFAULT_LOCAL_READER,
} from "@/services/scrapeService";
import { useToast } from "@/components/ui/use-toast";

export const ScraperStatusBadge = () => {
  const [isLocal, setIsLocal] = useState(false);
  const [endpoint, setEndpoint] = useState(getLocalReaderUrl());
  const [customUrl, setCustomUrl] = useState(getLocalReaderUrl());
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const verifyBackend = async () => {
    setChecking(true);
    try {
      const result = await checkScraperBackend();
      setIsLocal(result.isLocal);
      setEndpoint(result.endpoint);
    } catch {
      setIsLocal(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void verifyBackend();
  }, []);

  const handleSaveUrl = async () => {
    setLocalReaderUrl(customUrl);
    toast({
      title: "Scraper endpoint updated",
      description: `Testing ${customUrl}...`,
    });
    await verifyBackend();
  };

  const handleReset = async () => {
    setCustomUrl(DEFAULT_LOCAL_READER);
    setLocalReaderUrl(DEFAULT_LOCAL_READER);
    await verifyBackend();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-7 px-2 border border-border hover:border-primary/50 text-[11px] font-mono transition-colors focus:outline-none flex items-center gap-1.5"
          title="Click to inspect crawler backend"
        >
          <span
            className={`w-1.5 h-1.5 ${
              isLocal
                ? "bg-primary animate-pulse"
                : "bg-destructive"
            }`}
          />
          <span className="text-muted-foreground">READER:</span>
          <span className="font-bold text-foreground">
            {isLocal ? "LOCAL:8000" : "PROXY"}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md font-mono rounded-none border border-border bg-card p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <DialogTitle className="font-mono text-base font-bold text-foreground">
            CRAWLER ENDPOINT CONFIG
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-1">
            HTTP reader backend for retrieving primary domain documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 font-mono text-xs">
          <div className="border border-border p-3 bg-secondary/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px]">CURRENT TARGET</span>
              <span className={`text-[10px] font-bold ${isLocal ? "text-primary" : "text-destructive"}`}>
                {isLocal ? "[CONNECTED]" : "[FALLBACK ACTIVE]"}
              </span>
            </div>
            <p className="font-bold text-foreground break-all">
              {isLocal ? endpoint : "r.jina.ai (remote reader proxy)"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isLocal
                ? "Direct high-speed local Python Scrapling microservice."
                : "Local reader offline. Defaulting to secure public read-through proxy."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground">ENDPOINT URL</label>
            <div className="flex gap-2">
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 h-9 px-3 text-xs bg-background border border-border text-foreground font-mono focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={checking}
                className="btn-terminal px-3 h-9 text-xs"
              >
                {checking ? "..." : "SET"}
              </button>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5">
              <span>default: {DEFAULT_LOCAL_READER}</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-primary hover:underline"
              >
                reset
              </button>
            </div>
          </div>

          {!isLocal && (
            <div className="border border-border p-3 space-y-1.5 text-xs bg-secondary/20">
              <span className="text-primary font-bold">&gt; RUN LOCAL BACKEND</span>
              <pre className="p-2 border border-border bg-background text-[11px] font-mono overflow-x-auto text-primary">
                cd scrape-api&#10;uvicorn main:app --port 8000
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={verifyBackend}
              disabled={checking}
              className="btn-terminal px-3 h-8 text-xs"
            >
              {checking ? "[PROBING...]" : "[PROBE STATUS]"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border border-border px-3 h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              CLOSE
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
