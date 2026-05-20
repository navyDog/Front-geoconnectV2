import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useBEDashboardData } from './useBEDashboardData';
import * as AuthContextModule from '../contexts/AuthContext';

// Mock de tous les modules API
vi.mock('../api/bureauEtude', () => ({
  getBureauByUserId: vi.fn(),
}));
vi.mock('../api/demandeDevis', () => ({
  getAllDemandeDevis: vi.fn(),
}));
vi.mock('../api/propositionDevis', () => ({
  getPropositionDevisByBureauId: vi.fn(),
  getPropositionDevisByDemandeId: vi.fn(),
}));
vi.mock('../api/etude', () => ({
  getEtudesByBureauId: vi.fn(),
  getEtudeDetailById: vi.fn(),
  fetchEtudeDetails: vi.fn(),
}));

import { getBureauByUserId } from '../api/bureauEtude';
import { getAllDemandeDevis } from '../api/demandeDevis';
import { getPropositionDevisByBureauId, getPropositionDevisByDemandeId } from '../api/propositionDevis';
import { getEtudesByBureauId, fetchEtudeDetails } from '../api/etude';

const fakeBureau = { id: 10, raisonSociale: 'Bureau Test' };
const fakeDemande = { id: 1, description: 'Demande 1' };
const fakeProposition = { id: 5, bureauId: 10, demandeId: 1, statut: 'EN_ATTENTE' };
const fakeEtude = { id: 20, etat: 'DEVIS_VALIDE' };

function mockUseAuth(userId = 1) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: { userId, token: 'tok', role: 'BUREAU_ETUDE', email: 'be@test.com' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

describe('useBEDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne charge rien si user est null', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useBEDashboardData());

    // Reste en isLoading=true car le useEffect ne se déclenche pas sans user
    expect(result.current.isLoading).toBe(true);
    expect(result.current.bureau).toBeNull();
  });

  it('charge toutes les données en cas nominal', async () => {
    mockUseAuth();
    (getBureauByUserId as any).mockResolvedValue(fakeBureau);
    (getAllDemandeDevis as any).mockResolvedValue([fakeDemande]);
    (getPropositionDevisByBureauId as any).mockResolvedValue([fakeProposition]);
    (getPropositionDevisByDemandeId as any).mockResolvedValue([fakeProposition]);
    (getEtudesByBureauId as any).mockResolvedValue([fakeEtude]);
    (fetchEtudeDetails as any).mockResolvedValue([fakeEtude]);

    const { result } = renderHook(() => useBEDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bureau).toEqual(fakeBureau);
    expect(result.current.demandes).toEqual([fakeDemande]);
    expect(result.current.myPropositions).toEqual([fakeProposition]);
    expect(result.current.etudes).toEqual([fakeEtude]);
    expect(result.current.error).toBeNull();
  });

  it('positionne error si getBureauByUserId rejette', async () => {
    mockUseAuth();
    (getBureauByUserId as any).mockRejectedValue(new Error('Réseau KO'));

    const { result } = renderHook(() => useBEDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.bureau).toBeNull();
  });

  it("retourne des listes vides si les appels secondaires échouent (catch silencieux)", async () => {
    mockUseAuth();
    (getBureauByUserId as any).mockResolvedValue(fakeBureau);
    (getAllDemandeDevis as any).mockResolvedValue([fakeDemande]);
    // Simule un échec sur les propositions et études → doit retourner []
    (getPropositionDevisByBureauId as any).mockRejectedValue(new Error('KO'));
    (getPropositionDevisByDemandeId as any).mockRejectedValue(new Error('KO'));
    (getEtudesByBureauId as any).mockRejectedValue(new Error('KO'));
    (fetchEtudeDetails as any).mockResolvedValue([]);

    const { result } = renderHook(() => useBEDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull(); // erreurs secondaires silencieuses
    expect(result.current.myPropositions).toEqual([]);
    expect(result.current.etudes).toEqual([]);
  });

  it('refetch() redéclenche le chargement', async () => {
    mockUseAuth();
    (getBureauByUserId as any).mockResolvedValue(fakeBureau);
    (getAllDemandeDevis as any).mockResolvedValue([]);
    (getPropositionDevisByBureauId as any).mockResolvedValue([]);
    (getPropositionDevisByDemandeId as any).mockResolvedValue([]);
    (getEtudesByBureauId as any).mockResolvedValue([]);
    (fetchEtudeDetails as any).mockResolvedValue([]);

    const { result, rerender } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callCountBefore = (getBureauByUserId as any).mock.calls.length;

    // Déclenche refetch puis attend un nouveau cycle complet
    result.current.refetch();
    rerender();

    await waitFor(() => expect((getBureauByUserId as any).mock.calls.length).toBeGreaterThan(callCountBefore));
  });
});


