
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCopy } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { EntityDetailSkeleton } from '@/components/EntityDetailSkeleton';
import { EntityNotFound } from '@/components/EntityNotFound';
import { EntityDetailTabs } from '@/components/EntityDetailTabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { copyReport } from '@/services/report';

const EntityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entity, loading } = useEntityDetail(id);

  if (loading) {
    return <EntityDetailSkeleton />;
  }

  if (!entity) {
    return <EntityNotFound />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={async () => {
            const copied = entity ? await copyReport(entity) : false;
            toast({
              title: copied ? 'Report copied' : 'Copy failed',
              description: copied
                ? 'Markdown report with sources and scores is on your clipboard.'
                : 'The browser blocked clipboard access — try again or select text manually.',
            });
          }}
        >
          <ClipboardCopy className="w-4 h-4" />
          Copy report
        </Button>
      </div>

      <EntityDetailTabs entity={entity} />
    </div>
  );
};

export default EntityDetail;
