import api from './index';
import { EtudeDTO, EtudeDetailDTO } from '../types';

// ─── Transitions d'état ───────────────────────────────────────────────────────

/** BE → propose une date d'intervention */
export const proposerDateIntervention = async (id: number, dateIntervention: string): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/proposer-date`, { dateIntervention });
  return data;
};

/** CLIENT → valide la date proposée */
export const validerDateIntervention = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/valider-date`);
  return data;
};

/** CLIENT → refuse la date proposée */
export const refuserDateIntervention = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/refuser-date`);
  return data;
};

/** BE → marque l'intervention comme effectuée */
export const marquerInterventionEffectuee = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/intervention-effectuee`);
  return data;
};

/** BE → clôture le rapport (nécessite un document déjà uploadé) */
export const terminerRapport = async (id: number, rapportId: number, dateRendu: string): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/rapport-termine`, { rapportId, dateRendu });
  return data;
};

/** CLIENT → confirme le paiement */
export const confirmerPaiement = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/paiement-effectue`);
  return data;
};

/** BE → attache le devis signé (pas de transition d'état) */
export const attacherDevisSigne = async (id: number, documentId: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/devis-signe`, { documentId });
  return data;
};

// ─── CRUD de base ─────────────────────────────────────────────────────────────

export const createEtude = async (etude: EtudeDTO) => {
  const { data } = await api.post('/etude', etude);
  return data;
};

export const updateEtude = async (etude: EtudeDTO) => {
  const { data } = await api.put('/etude', etude);
  return data;
};

export const getEtudesByBureauId = async (bureauId: number): Promise<EtudeDTO[]> => {
  const { data } = await api.get(`/etude/bureauEtude/${bureauId}`);
  return data ?? [];
};

export const getEtudesByClientId = async (clientId: number): Promise<EtudeDTO[]> => {
  const { data } = await api.get(`/etude/client/${clientId}`);
  return data ?? [];
};

export const getEtudeDetailById = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.get(`/etude/${id}/detail`);
  return data;
};

/**
 * Enrichit une liste d'études légères (EtudeDTO) avec leur détail complet.
 * En cas d'échec pour une étude, retourne le DTO brut comme fallback.
 */
export async function fetchEtudeDetails(rawEtudes: EtudeDTO[]): Promise<EtudeDetailDTO[]> {
  return Promise.all(
    rawEtudes.map(e =>
      e.id
        ? getEtudeDetailById(e.id).catch(() => ({ ...e } as EtudeDetailDTO))
        : Promise.resolve({ ...e } as EtudeDetailDTO)
    )
  );
}

