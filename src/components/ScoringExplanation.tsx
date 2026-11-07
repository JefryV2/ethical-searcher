
// How the score is actually produced. This replaced an earlier page that
// described a weighted "ethical scoring algorithm", quarterly reviews and an
// ethics committee — none of which exist in this app. The score is a
// deterministic evidence-coverage total, and this page shows its exact terms.

import { Card } from "@/components/ui/card";
import {
  ShieldCheck,
  Database,
  BookOpen,
  Globe,
  FileSearch,
  Scale,
  Info,
  Ban,
} from 'lucide-react';

const BREAKDOWN = [
  {
    icon: <Database className="w-4 h-4 text-primary" />,
    label: 'A Wikidata record exists for the entity',
    points: '+20',
    note: 'Identity resolved to a real item (Q-number) with a description.',
  },
  {
    icon: <BookOpen className="w-4 h-4 text-primary" />,
    label: 'A Wikipedia summary was read',
    points: '+20',
    note: 'The article summary is reachable and non-empty.',
  },
  {
    icon: <Globe className="w-4 h-4 text-primary" />,
    label: 'The official site answered',
    points: '+15',
    note: 'At least one page of the entity’s own site was fetched successfully.',
  },
  {
    icon: <FileSearch className="w-4 h-4 text-primary" />,
    label: 'A disclosure signal was found',
    points: '+15',
    note: 'Pages mention sponsorships, paid partnerships or advertising disclosure.',
  },
  {
    icon: <FileSearch className="w-4 h-4 text-primary" />,
    label: 'A sourcing signal was found',
    points: '+10',
    note: 'Pages cite sources, references or a methodology.',
  },
  {
    icon: <FileSearch className="w-4 h-4 text-primary" />,
    label: 'An operations signal was found',
    points: '+15',
    note: 'Pages publish impact, annual, sustainability or transparency reports.',
  },
  {
    icon: <Scale className="w-4 h-4 text-primary" />,
    label: 'A conflict/issue-response signal was found',
    points: '+5',
    note: 'Pages discuss funding, conflicts of interest, corrections or investigations.',
  },
];

const BANDS = [
  { range: '0–49', label: 'Sparse record', tone: 'score-low' },
  { range: '50–69', label: 'Partial record', tone: 'score-mid' },
  { range: '70–89', label: 'Well documented', tone: 'score-good' },
  { range: '90–95', label: 'Extensive record', tone: 'score-good' },
];

export const ScoringExplanation = () => {
  return (
    <div className="space-y-6">
      <Card className="glass-card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="ds-text-headline-sm">How this score is calculated</h2>
        </div>
        <p className="ds-text-body-md text-muted-foreground max-w-3xl">
          The number is <strong className="text-foreground">evidence coverage</strong>, a fixed
          sum of what could be verified in public sources. There are no user-adjustable weights,
          no editorial committee and no quarterly review — the same inputs always produce the
          same score, and every input is listed on the record itself.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card className="glass-card p-5 space-y-1">
          <h3 className="ds-text-title-sm mb-2">Score components</h3>
          <ul className="divide-y divide-border">
            {BREAKDOWN.map((item) => (
              <li key={item.label} className="py-3 flex items-start gap-3">
                <span className="mt-0.5 shrink-0">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="ds-text-body-sm font-medium">{item.label}</p>
                  <p className="ds-text-body-sm text-muted-foreground">{item.note}</p>
                </div>
                <span className="ds-text-numeric-md text-primary shrink-0">{item.points}</span>
              </li>
            ))}
          </ul>
          <p className="ds-text-body-sm text-muted-foreground pt-3">
            The total is capped at <span className="ds-text-numeric-md">95</span> — a perfect 100
            would imply every possible page was read, which no audit can claim.
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card p-5 space-y-3">
            <h3 className="ds-text-title-sm">What the bands mean</h3>
            <div className="grid grid-cols-2 gap-2">
              {BANDS.map((band) => (
                <div key={band.range} className="border border-border rounded-md p-3">
                  <p className={`ds-text-numeric-md ${band.tone}`}>{band.range}</p>
                  <p className="ds-text-body-sm text-muted-foreground">{band.label}</p>
                </div>
              ))}
            </div>
            <p className="ds-text-body-sm text-muted-foreground">
              These describe how much material a reader can check — never whether the entity is
              good or bad.
            </p>
          </Card>

          <Card className="glass-card p-5 space-y-3">
            <h3 className="ds-text-title-sm">Where the evidence comes from</h3>
            <ul className="space-y-2 ds-text-body-sm text-muted-foreground">
              <li>Wikidata — identity, description, official links</li>
              <li>Wikipedia — summary, plus issue sections with section-level URLs</li>
              <li>The entity's own site — landing page and disclosure-ish pages</li>
              <li>Platform profiles linked from Wikidata</li>
            </ul>
            <p className="ds-text-body-sm text-muted-foreground">
              No accounts, API keys or paid data. If a source cannot be read, the record says so
              and the score stays lower.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="ds-text-title-sm">The model analysis is separate</h3>
          </div>
          <p className="ds-text-body-sm text-muted-foreground">
            The “Model analysis” tab runs MobileBERT-MNLI on the recorded evidence, entirely in
            your browser. Those entailment scores never change the evidence-coverage number on
            this page; the combined figure shown there is only a display aid.
          </p>
        </Card>

        <Card className="glass-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 score-mid" />
            <h3 className="ds-text-title-sm">What this score is not</h3>
          </div>
          <p className="ds-text-body-sm text-muted-foreground">
            It is not an ethics rating, a fact-check, or a prediction. A company can publish
            detailed reports and still behave badly; a small creator can be ethical and publish
            almost nothing. Read the sources before drawing conclusions.
          </p>
        </Card>
      </div>
    </div>
  );
};
