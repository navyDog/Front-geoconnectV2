import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBureauByUserId } from '../api/bureauEtude';
import { getAllDemandeDevis } from '../api/demandeDevis';
import { getPropositionDevisByBureauId, getPropositionDevisByDemandeId } from '../api/propositionDevis';
import { getEtudesByBureauId, fetchEtudeDetails } from '../api/etude';
import { getNotificationPreferences } from '../api/parametres';
import { BureauEtudesDTO, DemandeDevisDTO, NotificationPreferencesDTO, PropositionDevisDTO, EtudeDTO, EtudeDetailDTO } from '../types';
import { extractErrorMessage } from '../lib/utils';

interface BEDashboardData {
  bureau: BureauEtudesDTO | null;
  demandes: DemandeDevisDTO[];
  allPropositionsPerDemande: PropositionDevisDTO[][];
  myPropositions: PropositionDevisDTO[];
  etudes: EtudeDetailDTO[];
  /** Préférences de notification géographique — null tant que non chargées. */
  notificationPreferences: NotificationPreferencesDTO | null;
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
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesDTO | null>(null);
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

        const [allDemandes, myProps, rawEtudes, prefs] = await Promise.all([
          getAllDemandeDevis(),
          myBureau?.id ? getPropositionDevisByBureauId(myBureau.id).catch((): PropositionDevisDTO[] => []) : Promise.resolve([] as PropositionDevisDTO[]),
          myBureau?.id ? getEtudesByBureauId(myBureau.id).catch((): EtudeDTO[] => []) : Promise.resolve([] as EtudeDTO[]),
          getNotificationPreferences().catch(() => null),
        ]);

        if (cancelled) return;

        setDemandes(allDemandes || []);
        setMyPropositions(myProps || []);
        setNotificationPreferences(prefs);

        const allProps = await Promise.all(
          (allDemandes || []).map(d => getPropositionDevisByDemandeId(d.id).catch((): PropositionDevisDTO[] => []))
        );

        if (cancelled) return;
        setAllPropositionsPerDemande(allProps);

        const details = await fetchEtudeDetails(rawEtudes || []);

        if (!cancelled) setEtudes(details);
      } catch (err: any) {
        if (!cancelled) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [user, tick]);

  return { bureau, demandes, allPropositionsPerDemande, myPropositions, etudes, notificationPreferences, isLoading, error, refetch };
}

