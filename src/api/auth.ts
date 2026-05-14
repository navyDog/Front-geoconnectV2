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

/** Retourne { userId, login, role } — le JWT est posé en cookie HttpOnly par le backend. */
export const loginCall = async (credentials: LoginRequest): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

/** Retourne { userId, login, role } — le JWT est posé en cookie HttpOnly par le backend. */
export const registerCall = async (userData: RegisterRequest): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

/** Supprime le cookie HttpOnly jwt côté backend (Max-Age=0). */
export const logoutCall = async (): Promise<void> => {
  await api.post('/auth/logout');
};
