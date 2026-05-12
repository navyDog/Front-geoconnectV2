import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClientByUserId } from '../api/client';
import { getDemandeDevisByClientId } from '../api/demandeDevis';
import { getPropositionDevisByDemandeId } from '../api/propositionDevis';
import { getEtudesByClientId, getEtudeDetailById } from '../api/etude';
import { ClientDTO, DemandeDevisDTO, PropositionDevisDTO, EtudeDTO, EtudeDetailDTO } from '../types';

export type DemandeWithPropositions = DemandeDevisDTO & { propositions: PropositionDevisDTO[] };

interface ClientDashboardData {
  client: ClientDTO | null;
  demandes: DemandeWithPropositions[];
  etudes: EtudeDetailDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClientDashboardData(): ClientDashboardData {
  const { user } = useAuth();
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [demandes, setDemandes] = useState<DemandeWithPropositions[]>([]);
  const [etudes, setEtudes] = useState<EtudeDetailDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const myClient = await getClientByUserId(user!.userId);
        if (cancelled) return;

        if (!myClient?.id) {
          setIsLoading(false);
          return;
        }

        setClient(myClient);

        const rawDemandes = await getDemandeDevisByClientId(myClient.id);
        if (cancelled) return;

        const [enrichedDemandes, rawEtudes] = await Promise.all([
          Promise.all(
            rawDemandes.map(async (d): Promise<DemandeWithPropositions> => {
              try {
                const props = await getPropositionDevisByDemandeId(d.id!);
                return { ...d, propositions: props || [] };
              } catch {
                return { ...d, propositions: [] };
              }
            })
          ),
          getEtudesByClientId(myClient.id).catch((): EtudeDTO[] => []),
        ]);

        if (cancelled) return;
        setDemandes(enrichedDemandes);

        const details = await Promise.all(
          rawEtudes.map(e =>
            e.id
              ? getEtudeDetailById(e.id).catch(() => ({ ...e } as EtudeDetailDTO))
              : Promise.resolve({ ...e } as EtudeDetailDTO)
          )
        );

        if (!cancelled) setEtudes(details);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? err?.message ?? 'Erreur lors du chargement des données.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [user, tick]);

  return { client, demandes, etudes, isLoading, error, refetch };
}

