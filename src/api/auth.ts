import api from './index';
import { AuthResponseDTO } from '../types';

export const loginCall = async (credentials: any): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/api/auth/login', credentials);
  return data;
};

export const registerCall = async (userData: any): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/api/auth/register', userData);
  return data;
};
