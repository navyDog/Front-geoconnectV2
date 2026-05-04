import api from './index';
import { DemandeDevisDTO } from '../types';

export const createDemandeDevis = async (demande: DemandeDevisDTO) => {
  const { data } = await api.post('/demandeDevis', demande);
  return data;
};

export const getDemandeDevisByClientId = async (clientId: number): Promise<DemandeDevisDTO[]> => {
  const { data } = await api.get(`/demandeDevis/client/${clientId}`);
  return data;
};

export const getDemandeDevisById = async (id: number): Promise<DemandeDevisDTO> => {
  const { data } = await api.get(`/demandeDevis/${id}`);
  return data;
};

export const getAllDemandeDevis = async (): Promise<DemandeDevisDTO[]> => {
  const { data } = await api.get('/demandeDevis');
  return data;
};
