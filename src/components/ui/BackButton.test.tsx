import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from './BackButton';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderBackButton(props: { to: string; label?: string; className?: string }) {
  return render(
    <MemoryRouter>
      <BackButton {...props} />
    </MemoryRouter>,
  );
}

describe('BackButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ─── Rendu ────────────────────────────────────────────────────────────────

  it('affiche le libellé par défaut "Retour"', () => {
    renderBackButton({ to: '/dashboard' });
    expect(screen.getByRole('button', { name: /retour/i })).toBeTruthy();
  });

  it('affiche un libellé personnalisé', () => {
    renderBackButton({ to: '/dashboard', label: 'Retour au tableau de bord' });
    expect(screen.getByRole('button', { name: /retour au tableau de bord/i })).toBeTruthy();
  });

  it('est de type "button" (pas submit)', () => {
    renderBackButton({ to: '/x' });
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  it('applique une className additionnelle', () => {
    renderBackButton({ to: '/x', className: 'custom-class' });
    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  // ─── Navigation ───────────────────────────────────────────────────────────

  it('appelle navigate(to) avec la valeur exacte de la prop', () => {
    renderBackButton({ to: '/client/dashboard?tab=ETUDES' });
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard?tab=ETUDES');
  });

  it('navigue vers la prop to exacte (be dashboard)', () => {
    renderBackButton({ to: '/be/dashboard?tab=ETUDE_EN_COURS' });
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/be/dashboard?tab=ETUDE_EN_COURS');
  });

  it('déclenche navigate une seule fois par clic', () => {
    renderBackButton({ to: '/somewhere' });
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});
