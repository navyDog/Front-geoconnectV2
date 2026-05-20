import React from 'react';
import { Link } from 'react-router-dom';
import { EtudeDetailDTO } from '../../types';
import { buildEtudeDocuments, formatDateLong } from '../../lib/formatters';
import { DocumentList } from './DocumentList';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { EtudeStatusBadge } from './EtudeStatusBadge';
import { EtudeStepper } from './EtudeStepper';
import { ChevronLeft, MapPin, FileText, XCircle, Clock } from 'lucide-react';
import { TYPE_LABELS } from '../../constants/labels';

interface EtudeDetailLayoutProps {
  etude: EtudeDetailDTO;
  error: string | null;
  /** URL de retour vers le tableau de bord */
  backTo: string;
  /** Libellé du titre (ex : "Suivi d'étude" | "Gestion d'étude") */
  headerLabel: string;
  /** Bannière optionnelle "action requise" (rendu différent selon le rôle) */
  actionBanner?: React.ReactNode;
  /** Carte d'informations spécifique au rôle (Bureau | Client) */
  infoCard: React.ReactNode;
  /** Rôle transmis au stepper */
  etatRole: 'CLIENT' | 'BE';
  /** Fabrique les boutons d'action contextuels dans le stepper */
  renderActions: () => React.ReactNode;
}

/**
 * Mise en page partagée entre la page détail CLIENT et la page détail BE.
 * Seuls varient : le lien de retour, le libellé d'en-tête, la carte d'infos
 * gauche, la bannière d'action et le libellé du rapport.
 */
export function EtudeDetailLayout({
  etude,
  error,
  backTo,
  headerLabel,
  actionBanner,
  infoCard,
  etatRole,
  renderActions,
}: EtudeDetailLayoutProps) {
  const prop    = etude.propositionDevis;
  const demande = prop?.demandeDevis;
  const etat    = etude.etat;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link
        to={backTo}
        className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-3 h-3 mr-1" />
        Retour au tableau de bord
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {headerLabel} #{etude.id}
          </p>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {demande?.adresseProjet?.ville || 'Projet géotechnique'}
            {demande?.adresseProjet?.codePostal && (
              <span className="text-slate-400 font-normal text-sm">({demande.adresseProjet.codePostal})</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {demande?.type ? TYPE_LABELS[demande.type] ?? demande.type : 'Étude géotechnique'}
          </p>
        </div>
        <EtudeStatusBadge etat={etat} className="self-start sm:self-center" />
      </div>

      {/* Bannière action requise (spécifique au rôle) */}
      {actionBanner}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Colonne gauche : infos */}
        <div className="space-y-4">

          {/* Carte d'infos spécifique au rôle */}
          {infoCard}

          {/* Carte Dates (commune) */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Intervention</span>
                <span className="font-semibold text-slate-800">{formatDateLong(etude.dateIntervention) ?? '—'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rendu</span>
                <span className="font-semibold text-slate-800">{formatDateLong(etude.dateRendu) ?? '—'}</span>
              </div>

            </CardContent>
          </Card>

          {/* Carte Description (commune) */}
          {demande?.description && (
            <Card>
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-xs text-slate-600 leading-relaxed">{demande.description}</p>
              </CardContent>
            </Card>
          )}

          <DocumentList documents={buildEtudeDocuments(etude)} />
        </div>

        {/* Colonne droite : stepper */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Progression du dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <EtudeStepper
                etat={etat}
                role={etatRole}
                renderActions={renderActions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Spinner de chargement partagé */
export function EtudeDetailLoadingSpinner() {
  return (
    <div className="flex justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

