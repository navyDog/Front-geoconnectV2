import React from 'react';
import { Settings } from 'lucide-react';
import { useParametresNotifications } from '../../hooks/useParametresNotifications';
import { SectionNotifications } from '../../components/parametres/SectionNotifications';

/**
 * Page principale de l'onglet Paramètres pour les Bureaux d'Études.
 * Route : /be/parametres  (protégée par rôle BUREAU_ETUDE)
 *
 * Organisée en sections extensibles :
 *   - Notifications  ← implémentée
 *   - Mon profil     ← à venir
 *   - Sécurité       ← à venir
 */
export default function BEParametresPage() {
  const parametresState = useParametresNotifications();

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-slate-300" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-xs text-slate-500">Gérez vos préférences et informations</p>
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        <SectionNotifications {...parametresState} />

        {/* Sections futures — placeholders */}
        {/* <SectionProfil /> */}
        {/* <SectionSecurite /> */}
      </div>
    </div>
  );
}

