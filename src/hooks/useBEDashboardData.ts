import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBureauByUserId } from '../api/bureauEtude';
import { getAllDemandeDevis } from '../api/demandeDevis';
import { getPropositionDevisByBureauId, getPropositionDevisByDemandeId } from '../api/propositionDevis';
import { getEtudesByBureauId, getEtudeDetailById } from '../api/etude';
import { BureauEtudesDTO, DemandeDevisDTO, PropositionDevisDTO, EtudeDTO, EtudeDetailDTO } from '../types';

interface BEDashboardData {
  bureau: BureauEtudesDTO | null;
  demandes: DemandeDevisDTO[];
  allPropositionsPerDemande: PropositionDevisDTO[][];
  myPropositions: PropositionDevisDTO[];
  etudes: EtudeDetailDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBEDashboardData(): BEDashboardData {
  const { user } = useAuth();
  const [bureau, setBureau] = useState<BureauEtudesDTO | null>(null);
  const [demandes, setDemandes] = useState<DemandeDevisDTO[]>([]);
  const [allPropositionsPerDemande, setAllPropositionsPerDemande] = useState<PropositionDevisDTO[][]>([]);
  const [myPropositions, setMyPropositions] = useState<PropositionDevisDTO[]>([]);
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
        const myBureau = await getBureauByUserId(user!.userId);
        if (cancelled) return;

        if (myBureau) setBureau(myBureau);

        const [allDemandes, myProps, rawEtudes] = await Promise.all([
          getAllDemandeDevis(),
          myBureau?.id ? getPropositionDevisByBureauId(myBureau.id).catch((): PropositionDevisDTO[] => []) : Promise.resolve([] as PropositionDevisDTO[]),
          myBureau?.id ? getEtudesByBureauId(myBureau.id).catch((): EtudeDTO[] => []) : Promise.resolve([] as EtudeDTO[]),
        ]);

        if (cancelled) return;

        setDemandes(allDemandes || []);
        setMyPropositions(myProps || []);

        const allProps = await Promise.all(
          (allDemandes || []).map(d => getPropositionDevisByDemandeId(d.id).catch((): PropositionDevisDTO[] => []))
        );

        if (cancelled) return;
        setAllPropositionsPerDemande(allProps);

        const details = await Promise.all(
          (rawEtudes || []).map(e =>
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

  return { bureau, demandes, allPropositionsPerDemande, myPropositions, etudes, isLoading, error, refetch };
}

