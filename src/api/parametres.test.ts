import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotificationPreferences, updateNotificationPreferences } from './parametres';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const fakePrefs = {
  notifierTousDepartements: false,
  departementsSuivis: ['75', '92', '93'],
};

describe('parametres API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getNotificationPreferences ────────────────────────────────────────────────

  describe('getNotificationPreferences', () => {
    it('appelle GET /parametres/me/notifications et retourne les données', async () => {
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakePrefs });

      const result = await getNotificationPreferences();

      expect(api.get).toHaveBeenCalledOnce();
      expect(api.get).toHaveBeenCalledWith('/parametres/me/notifications');
      expect(result).toEqual(fakePrefs);
    });

    it('retourne notifierTousDepartements=true avec liste vide par défaut', async () => {
      const defaultPrefs = { notifierTousDepartements: true, departementsSuivis: [] };
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: defaultPrefs });

      const result = await getNotificationPreferences();

      expect(result.notifierTousDepartements).toBe(true);
      expect(result.departementsSuivis).toEqual([]);
    });

    it('laisse remonter l\'erreur si l\'API échoue', async () => {
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(getNotificationPreferences()).rejects.toThrow('401 Unauthorized');
    });
  });

  // ── updateNotificationPreferences ────────────────────────────────────────────

  describe('updateNotificationPreferences', () => {
    it('appelle PUT /parametres/me/notifications avec le corps et retourne la réponse', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakePrefs });

      const result = await updateNotificationPreferences(fakePrefs);

      expect(api.put).toHaveBeenCalledOnce();
      expect(api.put).toHaveBeenCalledWith('/parametres/me/notifications', fakePrefs);
      expect(result).toEqual(fakePrefs);
    });

    it('envoie notifierTousDepartements=true avec departementsSuivis vide', async () => {
      const allDepts = { notifierTousDepartements: true, departementsSuivis: [] };
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: allDepts });

      const result = await updateNotificationPreferences(allDepts);

      expect(api.put).toHaveBeenCalledWith('/parametres/me/notifications', allDepts);
      expect(result.notifierTousDepartements).toBe(true);
    });

    it('gère les codes Corse (2A, 2B) et DOM-TOM (971, 972…)', async () => {
      const corseDomTom = {
        notifierTousDepartements: false,
        departementsSuivis: ['2A', '2B', '971', '972'],
      };
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: corseDomTom });

      const result = await updateNotificationPreferences(corseDomTom);

      expect(result.departementsSuivis).toContain('2A');
      expect(result.departementsSuivis).toContain('971');
    });

    it('laisse remonter l\'erreur si l\'API répond 400', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('400 Bad Request'));

      await expect(updateNotificationPreferences({ notifierTousDepartements: false, departementsSuivis: [] })).rejects.toThrow('400 Bad Request');
    });
  });
});

