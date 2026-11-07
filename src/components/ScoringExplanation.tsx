// How the score is actually produced.
//
// The score is a deterministic evidence-coverage total, and this page
// shows its exact terms.

import { Card } from "@/components/ui/card";

const BREAKDOWN = [
  {
    tag: '[DATA]',
    label: 'A Wikidata record exists for the entity',
    points: '+20',
    note: 'Identity resolved to a real item (Q-number) with a description.',
  },
  {
    tag: '[WIKI]',
    label: 'A Wikipedia summary was read',
    points: '+20',
    note: 'The article summary is reachable and non-empty.',
  },
  {
    tag: '[SITE]',
    label: 'The official site answered',
    points: '+15',
    note: 'At least one page of the entity’s own site was fetched successfully.',
  },
  {
    tag: '[DISC]',
    label: 'A disclosure signal was found',
    points: '+15',
    note: 'Pages mention sponsorships, paid partnerships or advertising disclosure.',
  },
  {
    tag: '[SRCE]',
    label: 'A sourcing signal was found',
    points: '+10',
    note: 'Pages cite sources, references or a methodology.',
  },
  {
    tag: '[RPRT]',
    label: 'An operations signal was found',
    points: '+15',
    note: 'Pages publish impact, annual, sustainability or transparency reports.',
  },
  {
    tag: '[RESP]',
    label: 'A conflict/issue-response signal was found',
    points: '+5',
    note: 'Pages discuss funding, conflicts of interest, corrections or investigations.',
  },
];

const BANDS = [
  { range: '00–49', label: 'Sparse record', tone: 'score-low' },
  { range: '50–69', label: 'Partial record', tone: 'score-mid' },
  { range: '70–89', label: 'Well documented', tone: 'score-good' },
  { range: '90–95', label: 'Extensive record', tone: 'score-good' },
];

export const ScoringExplanation = () => {
  return (
    <div className="space-y-6 font-mono">
      <Card className="dossier-card p-6 space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <span className="text-primary font-bold text-xs select-none">&gt;&gt;</span>
          <h2 className="text-sm font-bold text-foreground">SCORING METHODOLOGY &amp; COVERAGE FORMULA</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          The index reflects <strong className="text-foreground">verifiable evidence coverage</strong> — a deterministic sum
          of what could be discovered and crawled in public open records. No subjective weights, no editorial committee.
          The identical inputs guarantee identical outputs.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card className="dossier-card p-5 space-y-2">
          <h3 className="text-xs font-bold text-foreground uppercase mb-2">Score Components</h3>
          <ul className="divide-y divide-border/60">
            {BREAKDOWN.map((item) => (
              <li key={item.label} className="py-2.5 flex items-start gap-3 text-xs">
                <span className="text-[10px] border border-border px-1 py-0.5 text-primary/80 shrink-0">
                  {item.tag}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-bold text-foreground">{item.label}</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{item.note}</p>
                </div>
                <span className="font-bold text-primary shrink-0">{item.points}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground pt-3 border-t border-border/40">
            * Maximum score capped at 95. An absolute 100 would imply total universe surveillance.
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="dossier-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase">Coverage Bands</h3>
            <div className="grid grid-cols-2 gap-2">
              {BANDS.map((band) => (
                <div key={band.range} className="border border-border p-2.5 bg-secondary/20">
                  <p className={`text-base font-bold ${band.tone}`}>{band.range}</p>
                  <p className="text-[11px] text-muted-foreground">{band.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Indicates verifiable public documentation density — not a moral verdict.
            </p>
          </Card>

          <Card className="dossier-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase">Data Ingestion Origins</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><span className="text-primary font-bold">↳</span> Wikidata: identity, legal entities, official URLs</li>
              <li><span className="text-primary font-bold">↳</span> Wikipedia: summary text &amp; controversy records</li>
              <li><span className="text-primary font-bold">↳</span> Direct Domain: official site pages &amp; policy links</li>
              <li><span className="text-primary font-bold">↳</span> Verified platform accounts linked in registry</li>
            </ul>
            <p className="text-[11px] text-muted-foreground pt-1">
              Zero authenticated APIs. If a source is unreachable, the score remains penalized.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="dossier-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xs">[ML]</span>
            <h3 className="text-xs font-bold text-foreground">MODEL AUDIT INDEPENDENCE</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Neural Audit executes on-device MobileBERT entailment directly against retrieved passages.
            These inference passes never modify the base evidence-coverage score.
          </p>
        </Card>

        <Card className="dossier-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-destructive font-bold text-xs">[!]</span>
            <h3 className="text-xs font-bold text-foreground">CRITICAL DISCLAIMER</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This system does not rate corporate morality. A bad actor can publish extensive glossy reports;
            an ethical small creator may publish zero disclosures. Read primary receipts directly.
          </p>
        </Card>
      </div>
    </div>
  );
};
