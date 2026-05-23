import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface ParametresButtonProps {
  /** Route cible, ex. "/be/parametres" ou "/client/parametres". */
  to: string;
}

/**
 * Bouton de navigation vers la page des paramètres.
 * Conçu pour s'insérer dans la barre de navigation principale,
 * à gauche du bouton des notifications.
 *
 * Réutilisable par tous les rôles (BE, Client…) via la prop `to`.
 */
export function ParametresButton({ to }: Readonly<ParametresButtonProps>) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      aria-label="Paramètres"
      aria-current={isActive ? 'page' : undefined}
      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isActive
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
      }`}
      title="Paramètres"
    >
      <Settings className="w-4 h-4" aria-hidden="true" />
    </Link>
  );
}

