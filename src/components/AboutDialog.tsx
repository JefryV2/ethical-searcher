import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AboutDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-7 px-2 border border-border hover:border-primary/50 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        >
          [ABOUT &amp; SCORING]
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto font-mono rounded-none border border-border bg-card p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <DialogTitle className="font-mono text-base font-bold text-foreground">
            TRNSPR // SYSTEM METHODOLOGY
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-1">
            Deterministic open-source evidence audit with browser-local neural evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs text-foreground font-mono">
          <div className="space-y-1.5 border-l-2 border-primary/50 pl-2.5">
            <h4 className="font-bold text-primary">
              1. EVIDENCE DENSITY (NOT MORAL RATING)
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              The 0–95 score measures verifiable primary evidence: corporate structures,
              sustainability disclosures, conflict registries, and dispute resolution receipts.
              Every claim maps to an immutable source URL with retrieval timestamp.
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-primary/50 pl-2.5">
            <h4 className="font-bold text-primary">
              2. IN-BROWSER ONNX RUNTIME
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Machine learning models execute entirely on-device via WebAssembly. Zero search tokens,
              queries, or retrieved passages are transmitted to third-party LLM providers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
              <div className="border border-border p-2 bg-secondary/30">
                <span className="font-bold text-foreground">all-MiniLM-L6-v2</span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  384-dimensional dense vectors for semantic passage retrieval, MMR deduplication, and PCA maps.
                </p>
              </div>
              <div className="border border-border p-2 bg-secondary/30">
                <span className="font-bold text-foreground">MobileBERT-MNLI</span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Entailment evaluation across neutral disclosure dimensions without training on entity identity.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-l-2 border-primary/50 pl-2.5">
            <h4 className="font-bold text-primary">
              3. OPEN DATA ARCHITECTURE
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Records are federated on-the-fly from Wikidata (taxonomies &amp; identifiers),
              Wikipedia (community documentation &amp; controversies), and live HTTP domain crawls.
            </p>
          </div>

          <div className="border-t border-border/40 pt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>TERMINAL RUNTIME v1.2</span>
            <span>ZERO TRACKING · ZERO ADS</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
