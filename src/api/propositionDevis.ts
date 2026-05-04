import api from './index';
import { PropositionDevisDTO } from '../types';

export const createPropositionDevis = async (proposition: PropositionDevisDTO) => {
  const { data } = await api.post('/propositionDevis', proposition);
  return data;
};

export const getPropositionDevisByDemandeId = async (demandeId: number): Promise<PropositionDevisDTO[]> => {
  const { data } = await api.get(`/propositionDevis/devis/${demandeId}`);
  return data;
};

export const getPropositionDevisByBureauId = async (bureauId: number): Promise<PropositionDevisDTO[]> => {
  const { data } = await api.get(`/propositionDevis/bureauEtude/${bureauId}`);
  return data;
};

export const updatePropositionDevis = async (proposition: PropositionDevisDTO) => {
  const { data } = await api.put('/propositionDevis', proposition);
  return data;
};
