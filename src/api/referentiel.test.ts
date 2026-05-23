import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTypesEtude, getDepartements } from './referentiel';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('getTypesEtude', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle GET /referentiel/types-etude et retourne les données', async () => {
    const mockData = [
      { code: 'G0', libelle: 'G0 — Étude préalable' },
      { code: 'G5', libelle: 'G5 — Diagnostic' },
    ];
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData });

    const result = await getTypesEtude();

    expect(api.get).toHaveBeenCalledOnce();
    expect(api.get).toHaveBeenCalledWith('/referentiel/types-etude');
    expect(result).toEqual(mockData);
  });

  it('retourne un tableau vide si l\'API renvoie []', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

    const result = await getTypesEtude();

    expect(result).toEqual([]);
  });

  it('laisse remonter l\'erreur si l\'API échoue', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network Error'));

    await expect(getTypesEtude()).rejects.toThrow('Network Error');
  });

  it('retourne bien les 7 types attendus quand l\'API les fournit', async () => {
    const allTypes = [
      { code: 'ASSAINISSEMENT', libelle: 'ASSAINISSEMENT — Assainissement' },
      { code: 'G0', libelle: 'G0 — Étude préalable' },
      { code: 'G1_ES_PGC', libelle: 'G1 ES PGC — Étude de site (PGC)' },
      { code: 'G1_ELAN', libelle: 'G1 ELAN — Étude de site (ELAN)' },
      { code: 'G2_AVP', libelle: 'G2 AVP — Avant-projet' },
      { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
      { code: 'G5', libelle: 'G5 — Diagnostic' },
    ];
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: allTypes });

    const result = await getTypesEtude();

    expect(result).toHaveLength(7);
    expect(result.map((t) => t.code)).toEqual([
      'ASSAINISSEMENT', 'G0', 'G1_ES_PGC', 'G1_ELAN', 'G2_AVP', 'G2_PRO', 'G5',
    ]);
  });
});

// ─── getDepartements ──────────────────────────────────────────────────────────

describe('getDepartements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle GET /referentiel/departements et retourne la liste', async () => {
    const mockDepts = [
      { code: '01', libelle: 'Ain' },
      { code: '75', libelle: 'Paris' },
      { code: '2A', libelle: 'Corse-du-Sud' },
      { code: '971', libelle: 'Guadeloupe' },
    ];
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockDepts });

    const result = await getDepartements();

    expect(api.get).toHaveBeenCalledOnce();
    expect(api.get).toHaveBeenCalledWith('/referentiel/departements');
    expect(result).toEqual(mockDepts);
  });

  it('retourne un tableau vide si l\'API renvoie []', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

    const result = await getDepartements();

    expect(result).toEqual([]);
  });

  it('gère les codes Corse (2A, 2B) comme des chaînes', async () => {
    const { default: api } = await import('./index');
    const depts = [{ code: '2A', libelle: 'Corse-du-Sud' }, { code: '2B', libelle: 'Haute-Corse' }];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: depts });

    const result = await getDepartements();

    expect(result[0].code).toBe('2A');
    expect(result[1].code).toBe('2B');
  });

  it('gère les codes DOM-TOM sur 3 chiffres', async () => {
    const { default: api } = await import('./index');
    const domTom = [
      { code: '971', libelle: 'Guadeloupe' },
      { code: '972', libelle: 'Martinique' },
      { code: '973', libelle: 'Guyane' },
      { code: '974', libelle: 'La Réunion' },
      { code: '976', libelle: 'Mayotte' },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: domTom });

    const result = await getDepartements();

    expect(result).toHaveLength(5);
    expect(result.map((d) => d.code)).toContain('971');
    expect(result.map((d) => d.code)).toContain('976');
  });

  it('laisse remonter l\'erreur si l\'API échoue', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network Error'));

    await expect(getDepartements()).rejects.toThrow('Network Error');
  });
});

