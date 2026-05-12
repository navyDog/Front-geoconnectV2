import React from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fond flouté */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-white/20"
        onClick={onCancel}
      />
      {/* Contenu */}
      <div className="relative bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full mx-4 p-6 z-10">
        <h3 className="text-base font-bold text-slate-800 mb-3">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

