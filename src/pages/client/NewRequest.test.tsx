import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import NewRequest from './NewRequest';
import * as referentielApi from '../../api/referentiel';
import * as demandeDevisApi from '../../api/demandeDevis';
import * as clientApi from '../../api/client';
import * as documentApi from '../../api/document';
import * as AuthContextModule from '../../contexts/AuthContext';

// ─── Mocks globaux ────────────────────────────────────────────────────────────

vi.mock('../../api/referentiel');
vi.mock('../../api/demandeDevis');
vi.mock('../../api/client');
vi.mock('../../api/document');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_TYPES = [
  { code: 'G0', libelle: 'G0 — Étude préalable' },
  { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
];

const MOCK_USER = { userId: 1, token: 'tok', role: 'CLIENT' as const, email: 'c@test.com' };
const MOCK_CLIENT = { id: 10 };

// ─── Helper de rendu ──────────────────────────────────────────────────────────

function renderNewRequest() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: MOCK_USER,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  } as ReturnType<typeof AuthContextModule.useAuth>);

  return render(
    <MemoryRouter>
      <NewRequest />
    </MemoryRouter>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NewRequest — chargement des types d\'étude', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
  });

  it('affiche "Chargement…" dans le select pendant la requête', async () => {
    // Promesse non résolue pour simuler un chargement en cours
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    renderNewRequest();

    const option = screen.getByText('Chargement…');
    expect(option).toBeTruthy();
    // Le select doit être désactivé
    const select = option.closest('select');
    expect(select).toHaveAttribute('disabled');
  });

  it('affiche les libellés issus de l\'API après chargement', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('G0 — Étude préalable')).toBeTruthy();
    });
    expect(screen.getByText('G2 PRO — Projet')).toBeTruthy();
  });

  it('retire le disabled du select après chargement', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('disabled');
    });
  });

  it('utilise le fallback statique (7 types) si l\'API échoue', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API down')
    );

    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('G5 — Diagnostic')).toBeTruthy();
    });

    const options = screen.getAllByRole('option');
    // 1 option placeholder "Sélectionner…" + 7 types
    expect(options).toHaveLength(8);
  });

  it('affiche "Sélectionner…" comme option par défaut après chargement', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('Sélectionner…')).toBeTruthy();
    });
  });
});

describe('NewRequest — soumission du formulaire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('soumet le formulaire et navigue vers /client/dashboard', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    // Attendre le chargement des types
    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    // Remplir les champs requis
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
    });
  });

  it('affiche un message d\'erreur si la création échoue', async () => {
    const user = userEvent.setup();
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Erreur serveur')
    );

    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigue vers /client/dashboard au clic sur Annuler', async () => {
    const user = userEvent.setup();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await user.click(screen.getByRole('button', { name: /annuler/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
  });

  it('transmet le clientId récupéré depuis l\'API', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G2 PRO — Projet'));

    await user.selectOptions(screen.getByRole('combobox'), 'G2_PRO');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '69000');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Lyon');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 10, type: 'G2_PRO' })
      );
    });
  });

  it('upload le document joint avant de créer la demande', async () => {
    const user = userEvent.setup();
    (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });

    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    // Sélectionner un fichier fictif
    const file = new File(['content'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(documentApi.uploadDocument).toHaveBeenCalledWith(file);
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ docsDevisId: 99 })
      );
    });
  });
});




