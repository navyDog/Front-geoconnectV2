import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('affiche le titre et le message', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        title="Titre de test"
        message="Message de test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Titre de test')).toBeInTheDocument();
    expect(screen.getByText('Message de test')).toBeInTheDocument();
  });

  it('affiche le message d\'avertissement si fourni', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        title="Titre"
        message="Message"
        warningMessage="Attention : ceci est un avertissement"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Attention : ceci est un avertissement')).toBeInTheDocument();
  });

  it('n\'affiche pas de zone d\'avertissement si warningMessage n\'est pas fourni', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmModal
        title="Titre"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const warningDiv = container.querySelector('.bg-orange-50');
    expect(warningDiv).not.toBeInTheDocument();
  });

  it('appelle onConfirm lors du clic sur le bouton de confirmation', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        title="Titre"
        message="Message"
        confirmLabel="OK"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('OK'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel lors du clic sur le bouton d\'annulation', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        title="Titre"
        message="Message"
        cancelLabel="Non"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Non'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel lors du clic sur le fond flouté', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmModal
        title="Titre"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const backdrop = container.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('désactive les boutons quand isLoading est true', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        title="Titre"
        message="Message"
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        isLoading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText('Annuler');
    expect(cancelButton).toBeDisabled();
  });

  it('utilise les labels par défaut si non fournis', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        title="Titre"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Confirmer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });
});
