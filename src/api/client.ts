import api from './index';
import { ClientDTO } from '../types';

export const createClient = async (client: ClientDTO) => {
  const { data } = await api.post('/client', client);
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

