import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  proposerDateIntervention,
  validerDateIntervention,
  refuserDateIntervention,
  marquerInterventionEffectuee,
  terminerRapport,
  confirmerPaiement,
  attacherDevisSigne,
  createEtude,
  updateEtude,
  getEtudesByBureauId,
  getEtudesByClientId,
  getEtudeDetailById,
  fetchEtudeDetails,
} from './etude';

vi.mock('./index', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeDetail = { id: 1, etat: 'DEVIS_VALIDE', bureauEtude: null, demandeDevis: null };
const fakeEtude  = { id: 1, etat: 'EN_COURS' };

beforeEach(() => vi.clearAllMocks());

// ─── Transitions d'état ───────────────────────────────────────────────────────

describe('proposerDateIntervention', () => {
  it('appelle PATCH /etude/{id}/proposer-date et retourne le détail', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });

    const result = await proposerDateIntervention(1, '2026-06-01');

    expect(api.patch).toHaveBeenCalledWith('/etude/1/proposer-date', { dateIntervention: '2026-06-01' });
    expect(result).toEqual(fakeDetail);
  });

  it('propage l\'erreur réseau', async () => {
    (api.patch as any).mockRejectedValueOnce(new Error('Network error'));
    await expect(proposerDateIntervention(1, '2026-06-01')).rejects.toThrow('Network error');
  });
});

describe('validerDateIntervention', () => {
  it('appelle PATCH /etude/{id}/valider-date', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await validerDateIntervention(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/valider-date');
    expect(result).toEqual(fakeDetail);
  });
});

describe('refuserDateIntervention', () => {
  it('appelle PATCH /etude/{id}/refuser-date', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await refuserDateIntervention(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/refuser-date');
    expect(result).toEqual(fakeDetail);
  });
});

describe('marquerInterventionEffectuee', () => {
  it('appelle PATCH /etude/{id}/intervention-effectuee', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await marquerInterventionEffectuee(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/intervention-effectuee');
    expect(result).toEqual(fakeDetail);
  });
});

describe('terminerRapport', () => {
  it('appelle PATCH /etude/{id}/rapport-termine avec rapportId et dateRendu', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await terminerRapport(1, 99, '2026-06-10');
    expect(api.patch).toHaveBeenCalledWith('/etude/1/rapport-termine', { rapportId: 99, dateRendu: '2026-06-10' });
    expect(result).toEqual(fakeDetail);
  });
});

describe('confirmerPaiement', () => {
  it('appelle PATCH /etude/{id}/paiement-effectue', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await confirmerPaiement(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/paiement-effectue');
    expect(result).toEqual(fakeDetail);
  });
});

describe('attacherDevisSigne', () => {
  it('appelle PATCH /etude/{id}/devis-signe avec documentId', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await attacherDevisSigne(1, 55);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/devis-signe', { documentId: 55 });
    expect(result).toEqual(fakeDetail);
  });
});

// ─── CRUD de base ─────────────────────────────────────────────────────────────

describe('createEtude', () => {
  it('appelle POST /etude et retourne la donnée', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeEtude });
    const result = await createEtude(fakeEtude as any);
    expect(api.post).toHaveBeenCalledWith('/etude', fakeEtude);
    expect(result).toEqual(fakeEtude);
  });
});

describe('updateEtude', () => {
  it('appelle PUT /etude et retourne la donnée', async () => {
    (api.put as any).mockResolvedValueOnce({ data: fakeEtude });
    const result = await updateEtude(fakeEtude as any);
    expect(api.put).toHaveBeenCalledWith('/etude', fakeEtude);
    expect(result).toEqual(fakeEtude);
  });
});

describe('getEtudesByBureauId', () => {
  it('retourne la liste des études pour un bureau', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeEtude] });
    const result = await getEtudesByBureauId(10);
    expect(api.get).toHaveBeenCalledWith('/etude/bureauEtude/10');
    expect(result).toEqual([fakeEtude]);
  });

  it('retourne [] si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });
    const result = await getEtudesByBureauId(10);
    expect(result).toEqual([]);
  });
});

describe('getEtudesByClientId', () => {
  it('retourne la liste des études pour un client', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeEtude] });
    const result = await getEtudesByClientId(5);
    expect(api.get).toHaveBeenCalledWith('/etude/client/5');
    expect(result).toEqual([fakeEtude]);
  });

  it('retourne [] si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: undefined });
    const result = await getEtudesByClientId(5);
    expect(result).toEqual([]);
  });
});

describe('getEtudeDetailById', () => {
  it('appelle GET /etude/{id}/detail et retourne le détail', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await getEtudeDetailById(1);
    expect(api.get).toHaveBeenCalledWith('/etude/1/detail');
    expect(result).toEqual(fakeDetail);
  });

  it('propage l\'erreur', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Not found'));
    await expect(getEtudeDetailById(999)).rejects.toThrow('Not found');
  });
});

// ─── fetchEtudeDetails ────────────────────────────────────────────────────────

describe('fetchEtudeDetails', () => {
  it('retourne [] pour une liste vide', async () => {
    const result = await fetchEtudeDetails([]);
    expect(result).toEqual([]);
  });

  it('enrichit chaque étude avec son détail', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await fetchEtudeDetails([fakeEtude as any]);
    expect(api.get).toHaveBeenCalledWith('/etude/1/detail');
    expect(result).toEqual([fakeDetail]);
  });

  it('utilise le DTO brut en fallback si getEtudeDetailById échoue', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('KO'));
    const result = await fetchEtudeDetails([fakeEtude as any]);
    // Doit retourner le DTO brut (spread) sans lever d'exception
    expect(result).toEqual([fakeEtude]);
  });

  it('résout les études sans id sans appel API', async () => {
    const noIdEtude = { etat: 'EN_COURS' };
    const result = await fetchEtudeDetails([noIdEtude as any]);
    expect(api.get).not.toHaveBeenCalled();
    expect(result).toEqual([noIdEtude]);
  });
});

