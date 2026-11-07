import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { mockEthicalData } from '@/data/mockEthicalData';
import type { EntityData } from '@/types/entityTypes';
import {
  loadEvidenceSnapshot,
  loadCachedEntity,
  saveEvidenceSnapshots,
  type EvidenceSnapshot,
} from '@/services/evidenceStore';
import { fetchWikidataEntity } from '@/services/wikidataService';
import { buildEntityFromLookup, lookupEntities } from '@/services/lookupService';

export const useEntityDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [evidence, setEvidence] = useState<EvidenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEntityData = async () => {
      try {
        setLoading(true);

        if (!id) {
          toast({
            title: "Entity not found",
            description: "Missing entity identifier",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // 1) First check sessionStorage from recent searches
        const searchResultsJson = sessionStorage.getItem('lastSearchResults');
        if (searchResultsJson) {
          try {
            const searchResults = JSON.parse(searchResultsJson) as EntityData[];
            const matchFromSearchResults = searchResults.find(
              (e) => String(e.id).toLowerCase() === String(id).toLowerCase(),
            );
            if (matchFromSearchResults) {
              if (!cancelled) {
                setEntity(matchFromSearchResults);
                setEvidence(loadEvidenceSnapshot(matchFromSearchResults.id));
                setLoading(false);
              }
              return;
            }
          } catch (error) {
            console.error("Error parsing search results from session storage:", error);
          }
        }

        // 2) Check cached live records from earlier searches on this tab
        const cachedLive = loadCachedEntity(id);
        if (cachedLive) {
          if (!cancelled) {
            setEntity(cachedLive);
            setEvidence(loadEvidenceSnapshot(cachedLive.id));
            setLoading(false);
          }
          return;
        }

        // 3) Check mock catalog
        const foundInMockData = mockEthicalData.find(
          (e) => String(e.id).toLowerCase() === String(id).toLowerCase(),
        );
        if (foundInMockData) {
          if (!cancelled) {
            setEntity(foundInMockData);
            setEvidence(loadEvidenceSnapshot(foundInMockData.id));
            setLoading(false);
          }
          return;
        }

        // 4) Deep link: Is ID a Wikidata QID (e.g., Q95, Q355)?
        const isQid = /^Q\d+$/i.test(id.trim());
        if (isQid) {
          const wdEntity = await fetchWikidataEntity(id.trim().toUpperCase());
          if (wdEntity) {
            const built = await buildEntityFromLookup(wdEntity);
            saveEvidenceSnapshots([built]);
            if (!cancelled) {
              setEntity(built.entity);
              setEvidence(loadEvidenceSnapshot(built.entity.id));
              setLoading(false);
            }
            return;
          }
        }

        // 5) Try live lookup by query/name
        const liveHits = await lookupEntities(id, { maxEntities: 1 });
        if (liveHits.length > 0) {
          const built = liveHits[0];
          saveEvidenceSnapshots([built]);
          if (!cancelled) {
            setEntity(built.entity);
            setEvidence(loadEvidenceSnapshot(built.entity.id));
            setLoading(false);
          }
          return;
        }

        // 6) Not found anywhere
        if (!cancelled) {
          toast({
            title: "Entity not found",
            description: `We couldn't find a record for "${id}".`,
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading entity:", error);
        if (!cancelled) {
          toast({
            title: "Error loading entity",
            description: error instanceof Error ? error.message : "Please try again later",
            variant: "destructive",
          });
          navigate('/');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchEntityData();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, toast]);

  return {
    entity,
    evidence,
    loading,
  };
};
