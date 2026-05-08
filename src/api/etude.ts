import api from './index';
import { EtudeDTO } from '../types';

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