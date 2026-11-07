import { useParams } from 'react-router-dom';
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
  const { entity, evidence, loading } = useEntityDetail(id);

  if (loading) {
    return <EntityDetailSkeleton />;
  }

  if (!entity) {
    return <EntityNotFound />;
  }

  return (
    <div className="container mx-auto py-8 px-4 font-mono">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <span>&lt;--</span>
          <span>RETURN TO SEARCH</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-terminal px-3 h-8 text-xs flex items-center gap-1.5"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href);
              toast({
                title: 'URL copied',
                description: 'Record URL placed on clipboard.',
              });
            }}
          >
            <span>[SHARE LINK]</span>
          </button>
          <button
            type="button"
            className="btn-terminal px-3 h-8 text-xs flex items-center gap-1.5"
            onClick={async () => {
              const copied = entity ? await copyReport(entity) : false;
              toast({
                title: copied ? 'Report copied' : 'Copy failed',
                description: copied
                  ? 'Markdown report with raw sources and scores placed on clipboard.'
                  : 'Clipboard access blocked by browser.',
              });
            }}
          >
            <span>[EXPORT DUMP]</span>
          </button>
        </div>
      </div>

      <EntityDetailTabs entity={entity} evidence={evidence} />
    </div>
  );
};

export default EntityDetail;
