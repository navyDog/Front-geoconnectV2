import api from './index';
import { ClientDTO } from '../types';

export const createClient = async (client: ClientDTO) => {
  const { data } = await api.post('/client', client);
  return data;
};

export const updateClient = async (client: ClientDTO) => {
  const { data } = await api.put('/client', client);
  return data;
};

export const getClientById = async (id: number): Promise<ClientDTO> => {
  const { data } = await api.get(`/client/${id}`);
  return data;
};

export const getAllClients = async (): Promise<ClientDTO[]> => {
  const { data } = await api.get('/client');
  return data;
};

/**
 * Retourne le profil client de l'utilisateur connecté via GET /client/me.
 * Le paramètre userId est conservé pour compatibilité de signature mais n'est plus utilisé :
 * l'identité est lue depuis le JWT côté backend.
 */
export const getClientByUserId = async (_userId: number): Promise<ClientDTO | null> => {
  const { data } = await api.get('/client/me');
  return data ?? null;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/client/${id}`);
};
