
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { EntityDetailSkeleton } from '@/components/EntityDetailSkeleton';
import { EntityNotFound } from '@/components/EntityNotFound';
import { CustomWeightsInfo } from '@/components/CustomWeightsInfo';
import { CustomWeightsToggle } from '@/components/CustomWeightsToggle';
import { EntityDetailTabs } from '@/components/EntityDetailTabs';
import { useNavigate } from 'react-router-dom';

const EntityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    entity,
    loading,
    customWeights,
    showWeightsInfo,
    showCustomWeights,
    setShowWeightsInfo,
    toggleCustomWeights,
    handleSaveWeights
  } = useEntityDetail(id);

  if (loading) {
    return <EntityDetailSkeleton />;
  }

  if (!entity) {
    return <EntityNotFound />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>
      </div>
      
      {showWeightsInfo && (
        <CustomWeightsInfo onDismiss={() => setShowWeightsInfo(false)} />
      )}
      
      <CustomWeightsToggle 
        showCustomWeights={showCustomWeights}
        toggleCustomWeights={toggleCustomWeights}
        entityType={entity.type}
        savedWeights={customWeights}
        onSaveWeights={handleSaveWeights}
      />
      
      <EntityDetailTabs entity={entity} />
    </div>
  );
};

export default EntityDetail;
