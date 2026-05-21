import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createClient,
  updateClient,
  getClientById,
  getAllClients,
  getClientByUserId,
  deleteClient,
} from './client';

vi.mock('./index', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeClient = {
  id: 3,
  nom: 'Dupont',
  prenom: 'Jean',
  emailContact: 'jean.dupont@test.com',
  utilisateurId: 1,
};

beforeEach(() => vi.clearAllMocks());

describe('createClient', () => {
  it('appelle POST /client et retourne le client créé', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeClient });

    const result = await createClient(fakeClient as any);

    expect(api.post).toHaveBeenCalledWith('/client', fakeClient);
    expect(result).toEqual(fakeClient);
  });

  it('propage l\'erreur', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Conflict'));

    await expect(createClient(fakeClient as any)).rejects.toThrow('Conflict');
  });
});

describe('updateClient', () => {
  it('appelle PUT /client et retourne le client mis à jour', async () => {
    const updated = { ...fakeClient, nom: 'Martin' };
    (api.put as any).mockResolvedValueOnce({ data: updated });

    const result = await updateClient(updated as any);

    expect(api.put).toHaveBeenCalledWith('/client', updated);
    expect(result).toEqual(updated);
  });

  it('propage l\'erreur réseau', async () => {
    (api.put as any).mockRejectedValueOnce(new Error('Serveur KO'));

    await expect(updateClient(fakeClient as any)).rejects.toThrow('Serveur KO');
  });
});

describe('getClientById', () => {
  it('appelle GET /client/{id} et retourne le client', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeClient });

    const result = await getClientById(3);

    expect(api.get).toHaveBeenCalledWith('/client/3');
    expect(result).toEqual(fakeClient);
  });

  it('propage l\'erreur si non trouvé', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Not found'));

    await expect(getClientById(999)).rejects.toThrow('Not found');
  });
});

describe('getAllClients', () => {
  it('appelle GET /client et retourne la liste', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeClient] });

    const result = await getAllClients();

    expect(api.get).toHaveBeenCalledWith('/client');
    expect(result).toEqual([fakeClient]);
  });

  it('retourne une liste vide si aucun client', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [] });

    const result = await getAllClients();

    expect(result).toEqual([]);
  });
});

describe('getClientByUserId', () => {
  it('appelle GET /client/me et retourne le client', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeClient });

    const result = await getClientByUserId(1);

    expect(api.get).toHaveBeenCalledWith('/client/me');
    expect(result).toEqual(fakeClient);
  });

  it('retourne null si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });

    const result = await getClientByUserId(1);

    expect(result).toBeNull();
  });

  it('propage l\'erreur réseau', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(getClientByUserId(1)).rejects.toThrow('Unauthorized');
  });
});

describe('deleteClient', () => {
  it('appelle DELETE /client/{id}', async () => {
    (api.delete as any).mockResolvedValueOnce({});

    await deleteClient(3);

    expect(api.delete).toHaveBeenCalledWith('/client/3');
  });

  it('propage l\'erreur', async () => {
    (api.delete as any).mockRejectedValueOnce(new Error('Forbidden'));

    await expect(deleteClient(3)).rejects.toThrow('Forbidden');
  });
});

