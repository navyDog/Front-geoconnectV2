import api from './index';
import { EtudeDTO, EtudeDetailDTO } from '../types';

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
