import api from './index';
import { AuthResponseDTO } from '../types';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  login: string;
  password: string;
  role: 'CLIENT' | 'BUREAU_ETUDE';
}

export const loginCall = async (credentials: LoginRequest): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/api/auth/login', credentials);
  return data;
};

export const registerCall = async (userData: RegisterRequest): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/api/auth/register', userData);
  return data;
};
