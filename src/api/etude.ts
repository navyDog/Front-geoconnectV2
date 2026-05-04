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
