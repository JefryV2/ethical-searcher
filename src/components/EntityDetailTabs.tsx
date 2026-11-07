import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntityDetailView } from '@/components/EntityDetailView';
import { EvidenceAskPanel } from '@/components/EvidenceAskPanel';
import { ScoringExplanation } from '@/components/ScoringExplanation';
import { ModelTransparencyPanel } from '@/components/ModelTransparencyPanel';
import { RuleModelAgreement } from '@/components/RuleModelAgreement';
import { ModelLabPanel } from '@/components/ModelLabPanel';
import type { EntityData } from '@/types/entityTypes';
import type { EvidenceSnapshot } from '@/services/evidenceStore';

interface EntityDetailTabsProps {
  entity: EntityData;
  evidence?: EvidenceSnapshot | null;
}

const TAB_ITEMS = [
  { value: 'details', label: 'evidence'   },
  { value: 'ask',     label: 'query'      },
  { value: 'model',   label: 'ml-audit'   },
  { value: 'scoring', label: 'methodology'},
];

export const EntityDetailTabs = ({ entity, evidence }: EntityDetailTabsProps) => {
  const passages = evidence?.passages ?? [];

  return (
    <Tabs defaultValue="details" className="w-full max-w-6xl mx-auto">
      {/* Terminal-style tab strip */}
      <TabsList className="flex h-auto bg-transparent p-0 rounded-none border-b border-border mb-8 w-full justify-start gap-0 overflow-x-auto">
        {TAB_ITEMS.map(({ value, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="
              h-9 px-4 rounded-none border-0 border-b-2 border-transparent shrink-0
              font-mono text-xs text-muted-foreground -mb-px
              data-[state=active]:text-primary data-[state=active]:border-primary
              data-[state=active]:bg-transparent data-[state=active]:shadow-none
              hover:text-foreground transition-colors
            "
          >
            ./{label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="details" className="focus-visible:outline-none fade-in-element">
        <EntityDetailView entity={entity} evidence={evidence} />
      </TabsContent>

      <TabsContent value="ask" className="focus-visible:outline-none fade-in-element">
        <EvidenceAskPanel entity={entity} passages={passages} />
      </TabsContent>

      <TabsContent value="model" className="focus-visible:outline-none fade-in-element">
        <div className="space-y-6">
          <ModelTransparencyPanel entity={entity} />
          <RuleModelAgreement entityId={entity.id} passages={passages} />
          <ModelLabPanel />
        </div>
      </TabsContent>

      <TabsContent value="scoring" className="focus-visible:outline-none fade-in-element">
        <ScoringExplanation />
      </TabsContent>
    </Tabs>
  );
};
