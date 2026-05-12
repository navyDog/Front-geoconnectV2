import api from './index';
import { BureauEtudesDTO } from '../types';

export const createBureauEtude = async (bureau: BureauEtudesDTO) => {
  const { data } = await api.post('/bureauEtude', bureau);
  return data;
};

export const updateBureauEtude = async (bureau: BureauEtudesDTO) => {
  const { data } = await api.put('/bureauEtude', bureau);
  return data;
};

export const getBureauEtudeById = async (id: number): Promise<BureauEtudesDTO> => {
  const { data } = await api.get(`/bureauEtude/${id}`);
  return data;
};

export const getAllBureauEtude = async (): Promise<BureauEtudesDTO[]> => {
  const { data } = await api.get('/bureauEtude');
  return data;
};

export const deleteBureauEtude = async (id: number): Promise<void> => {
  await api.delete(`/bureauEtude/${id}`);
};
