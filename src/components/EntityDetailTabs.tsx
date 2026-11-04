
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntityCard } from '@/components/EntityCard';
import { ScoringExplanation } from '@/components/ScoringExplanation';
import { CreatorTransparency } from '@/components/CreatorTransparency';
import { ModelTransparencyPanel } from '@/components/ModelTransparencyPanel';

interface EntityDetailTabsProps {
  entity: any;
}

export const EntityDetailTabs = ({ entity }: EntityDetailTabsProps) => {
  return (
    <Tabs defaultValue="details" className="w-full max-w-5xl mx-auto">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="model">Model analysis</TabsTrigger>
        {entity.type === 'creator' && (
          <TabsTrigger value="transparency">Transparency</TabsTrigger>
        )}
        <TabsTrigger value="scoring">Scoring Methodology</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-6">
        <EntityCard {...entity} />
      </TabsContent>
      
      {/* Mounted only when the tab is opened, so the model costs nothing unless used */}
      <TabsContent value="model" className="space-y-6">
        <ModelTransparencyPanel entity={entity} />
      </TabsContent>
      
      {entity.type === 'creator' && (
        <TabsContent value="transparency" className="space-y-6">
          <CreatorTransparency entity={entity} />
        </TabsContent>
      )}
      
      <TabsContent value="scoring" className="space-y-6">
        <ScoringExplanation entityType={entity.type} />
      </TabsContent>
    </Tabs>
  );
};
