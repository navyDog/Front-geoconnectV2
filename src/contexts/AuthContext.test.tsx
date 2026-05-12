import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// Composant helper pour accéder au contexte dans les tests
const AuthConsumer: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="userId">{user?.userId ?? 'none'}</span>
    </div>
  );
};

const AuthActionsConsumer: React.FC = () => {
  const { login, logout, user } = useAuth();
  return (
    <div>
      <span data-testid="userId">{user?.userId ?? 'none'}</span>
      <button onClick={() => login({ userId: 42, token: 'tok', role: 'CLIENT', email: 'a@b.com' })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("démarre en état chargement puis non authentifié si localStorage vide", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('userId').textContent).toBe('none');
  });

  it("restaure l'utilisateur depuis localStorage au démarrage", async () => {
    const fakeUser = { userId: 1, token: 'abc', role: 'CLIENT', email: 'test@test.com' };
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', JSON.stringify(fakeUser));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('userId').textContent).toBe('1');
  });

  it("ne crashe pas si le JSON du localStorage est corrompu", async () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', '{invalid-json}');

    expect(() =>
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      )
    ).not.toThrow();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it("login() stocke le token et l'utilisateur dans localStorage", async () => {
    const { getByText } = render(
      <AuthProvider>
        <AuthActionsConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('userId').textContent).toBe('none');
    });

    act(() => { getByText('login').click(); });

    expect(localStorage.getItem('token')).toBe('tok');
    expect(JSON.parse(localStorage.getItem('user')!).userId).toBe(42);
    expect(screen.getByTestId('userId').textContent).toBe('42');
  });

  it("logout() vide localStorage et remet user à null", async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify({ userId: 42, token: 'tok', role: 'CLIENT', email: 'a@b.com' }));

    const { getByText } = render(
      <AuthProvider>
        <AuthActionsConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('userId').textContent).toBe('42');
    });

    act(() => { getByText('logout').click(); });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('userId').textContent).toBe('none');
  });

  it("useAuth() lève une erreur si utilisé hors AuthProvider", () => {
    // On neutralise console.error pour éviter le bruit dans la sortie
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});

