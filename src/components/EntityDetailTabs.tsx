
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntityDetailView } from '@/components/EntityDetailView';
import { ScoringExplanation } from '@/components/ScoringExplanation';
import { ModelTransparencyPanel } from '@/components/ModelTransparencyPanel';
import type { EntityData } from '@/types/entityTypes';
import type { EvidenceSnapshot } from '@/services/evidenceStore';

interface EntityDetailTabsProps {
  entity: EntityData;
  evidence?: EvidenceSnapshot | null;
}

export const EntityDetailTabs = ({ entity, evidence }: EntityDetailTabsProps) => {
  return (
    <Tabs defaultValue="details" className="w-full max-w-6xl mx-auto">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="model">
          <span className="sm:hidden">Model</span>
          <span className="hidden sm:inline">Model analysis</span>
        </TabsTrigger>
        <TabsTrigger value="scoring">
          <span className="sm:hidden">Scoring</span>
          <span className="hidden sm:inline">How scoring works</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <EntityDetailView entity={entity} evidence={evidence} />
      </TabsContent>

      {/* Mounted only when the tab is opened, so the model costs nothing unless used */}
      <TabsContent value="model">
        <ModelTransparencyPanel entity={entity} />
      </TabsContent>

      <TabsContent value="scoring">
        <ScoringExplanation />
      </TabsContent>
    </Tabs>
  );
};
