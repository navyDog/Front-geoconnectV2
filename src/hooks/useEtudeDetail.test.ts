import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useEtudeDetail } from './useEtudeDetail';
import { ToastProvider } from '../contexts/ToastContext';

vi.mock('../api/etude', () => ({
  getEtudeDetailById: vi.fn(),
}));

import { getEtudeDetailById } from '../api/etude';

const fakeEtude = {
  id: 42,
  etat: 'EN_COURS',
  bureauEtude: { id: 10, raisonSociale: 'Bureau Test' },
  demandeDevis: { id: 1, description: 'Travaux' },
};

// Le hook utilise useToast → on enveloppe dans ToastProvider
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children);

describe('useEtudeDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ne charge pas si id est undefined', async () => {
    const { result } = renderHook(() => useEtudeDetail(undefined), { wrapper });
    // isLoading reste true mais etude reste null
    expect(result.current.etude).toBeNull();
  });

  it('charge l\'étude en cas nominal', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getEtudeDetailById).toHaveBeenCalledWith(42);
    expect(result.current.etude).toEqual(fakeEtude);
    expect(result.current.error).toBeNull();
  });

  it('positionne error si getEtudeDetailById échoue', async () => {
    (getEtudeDetailById as any).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useEtudeDetail('99'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.etude).toBeNull();
    expect(result.current.error).toBe("Impossible de charger les données de l'étude.");
  });

  it('withAction exécute la fonction puis re-fetche le détail', async () => {
    (getEtudeDetailById as any)
      .mockResolvedValueOnce(fakeEtude)               // chargement initial
      .mockResolvedValueOnce({ ...fakeEtude, etat: 'TERMINE' }); // après action

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.etude).toEqual({ ...fakeEtude, etat: 'TERMINE' });
    expect(result.current.actionLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('withAction positionne error si l\'action échoue', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockRejectedValue({ message: 'Action impossible' });

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(result.current.error).toBe('Action impossible');
    expect(result.current.actionLoading).toBe(false);
  });

  it('withAction utilise response.data.message si disponible', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockRejectedValue({
      response: { data: { message: 'Erreur métier backend' } },
    });

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(result.current.error).toBe('Erreur métier backend');
  });

  it('withAction retourne le fallback si aucun message', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockRejectedValue({});

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(result.current.error).toBe('Une erreur est survenue.');
  });
});

