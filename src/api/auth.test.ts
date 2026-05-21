import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginCall, registerCall, logoutCall } from './auth';

vi.mock('./index', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from './index';

const fakeAuthResponse = { userId: 1, login: 'user@test.com', role: 'CLIENT' as const };

beforeEach(() => vi.clearAllMocks());

describe('loginCall', () => {
  it('appelle POST /auth/login avec les credentials et retourne le DTO auth', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeAuthResponse });

    const credentials = { login: 'user@test.com', password: 'secret' };
    const result = await loginCall(credentials);

    expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
    expect(result).toEqual(fakeAuthResponse);
  });

  it('propage l\'erreur si le serveur retourne 401', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(loginCall({ login: 'bad', password: 'bad' })).rejects.toThrow('Unauthorized');
  });
});

describe('registerCall', () => {
  it('appelle POST /auth/register avec les données et retourne le DTO auth', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeAuthResponse });

    const userData = { login: 'new@test.com', password: 'pass', role: 'CLIENT' as const };
    const result = await registerCall(userData);

    expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
    expect(result).toEqual(fakeAuthResponse);
  });

  it('supporte le rôle BUREAU_ETUDE', async () => {
    (api.post as any).mockResolvedValueOnce({ data: { ...fakeAuthResponse, role: 'BUREAU_ETUDE' } });

    const userData = { login: 'be@test.com', password: 'pass', role: 'BUREAU_ETUDE' as const };
    const result = await registerCall(userData);

    expect(result.role).toBe('BUREAU_ETUDE');
  });

  it('propage l\'erreur si les données sont invalides', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Bad request'));

    await expect(
      registerCall({ login: '', password: '', role: 'CLIENT' })
    ).rejects.toThrow('Bad request');
  });
});

describe('logoutCall', () => {
  it('appelle POST /auth/logout et résout sans valeur', async () => {
    (api.post as any).mockResolvedValueOnce({});

    await expect(logoutCall()).resolves.toBeUndefined();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('propage l\'erreur réseau', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(logoutCall()).rejects.toThrow('Network error');
  });
});

