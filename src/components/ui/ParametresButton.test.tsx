import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ParametresButton } from './ParametresButton';

function renderButton(to: string, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ParametresButton to={to} />
    </MemoryRouter>,
  );
}

describe('ParametresButton', () => {
  // ── Rendu ─────────────────────────────────────────────────────────────────────

  it('affiche un lien avec le label accessible "Paramètres"', () => {
    renderButton('/be/parametres');
    expect(screen.getByRole('link', { name: /paramètres/i })).toBeTruthy();
  });

  it('pointe vers la bonne route passée en prop', () => {
    renderButton('/be/parametres');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.getAttribute('href')).toBe('/be/parametres');
  });

  it('pointe vers /client/parametres quand la prop to est /client/parametres', () => {
    renderButton('/client/parametres');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.getAttribute('href')).toBe('/client/parametres');
  });

  it('contient une icône Settings (svg)', () => {
    renderButton('/be/parametres');
    // L'icône Settings de lucide-react rend un SVG
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.querySelector('svg')).toBeTruthy();
  });

  // ── État actif / inactif ──────────────────────────────────────────────────────

  it('a aria-current="page" quand la route correspond au pathname actuel', () => {
    renderButton('/be/parametres', '/be/parametres');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('a aria-current="page" pour une sous-route de /be/parametres', () => {
    renderButton('/be/parametres', '/be/parametres/notifications');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('n\'a pas aria-current quand la route ne correspond pas', () => {
    renderButton('/be/parametres', '/be/dashboard');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.getAttribute('aria-current')).toBeNull();
  });

  it('applique la classe active (blue) quand la route correspond', () => {
    renderButton('/be/parametres', '/be/parametres');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.className).toContain('bg-blue-600');
  });

  it('applique la classe inactive (slate) quand la route ne correspond pas', () => {
    renderButton('/be/parametres', '/be/dashboard');
    const link = screen.getByRole('link', { name: /paramètres/i });
    expect(link.className).toContain('bg-slate-700');
  });
});

