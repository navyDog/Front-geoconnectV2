import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEtudeDetailById, validerDateIntervention, refuserDateIntervention, confirmerPaiement } from '../../api/etude';
import { openDocument } from '../../api/document';
import { EtudeDetailDTO, EtatEtude } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EtudeStatusBadge, clientMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeStepper } from '../../components/etude/EtudeStepper';
import {
  ChevronLeft, MapPin, Building2, FileText,
  CheckCircle2, XCircle, CreditCard, AlertCircle, Download, Clock,
} from 'lucide-react';
import { TYPE_LABELS } from '../../constants/labels';
import { formatDateLong } from '../../lib/formatters';
import { useToast } from '../../contexts/ToastContext';

export default function ClientEtudeDetail() {
  const { id } = useParams<{ id: string }>();
  const { toastError } = useToast();
  const [etude, setEtude] = useState<EtudeDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (error) toastError(error); }, [error, toastError]);

  const fetchEtude = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getEtudeDetailById(Number(id));
      setEtude(data);
    } catch {
      setError("Impossible de charger les données de l'étude.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEtude(); }, [fetchEtude]);

  /**
   * Exécute une action PATCH puis re-fetche le détail complet.
   * On ne se fie pas à la réponse du PATCH (DTO partiel sans relations) pour
   * éviter les écrans vides après transition d'état.
   */
  const withAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true);
    setError(null);
    try {
      await fn();
      const refreshed = await getEtudeDetailById(Number(id));
      setEtude(refreshed);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!etude) {
    return <div className="text-center text-slate-500 py-12">Étude introuvable.</div>;
  }

  const prop    = etude.propositionDevis;
  const demande = prop?.demandeDevis;
  const bureau  = prop?.bureauEtude;
  const etat    = etude.etat as EtatEtude | undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link
        to="/client/dashboard"
        className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-3 h-3 mr-1" />
        Retour au tableau de bord
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suivi d'étude #{etude.id}</p>
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

      {/* Bannière action requise */}
      {clientMustAct(etat) && etude.dateIntervention && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Une action de votre part est requise pour faire avancer ce dossier.
        </div>
      )}

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
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Bureau d'études
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-1.5 text-xs">
              <p className="font-bold text-slate-800">{bureau?.raisonSociale || '—'}</p>
              {bureau?.emailContact && <p className="text-slate-500">{bureau.emailContact}</p>}
              {bureau?.telContact && <p className="text-slate-500">{bureau.telContact}</p>}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 mt-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant</p>
                  <p className="font-bold text-slate-800">{prop?.prix != null ? `${prop.prix} €` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Délai rendu</p>
                  <p className="font-bold text-slate-800">{prop?.delaiMaxRendu != null ? `${prop.delaiMaxRendu} j` : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
              {etude.rapportId != null && (
                <button
                  onClick={() => openDocument(etude.rapportId!)}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-[11px] transition-colors mt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger le rapport
                </button>
              )}
            </CardContent>
          </Card>

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
                role="CLIENT"
                renderActions={() => (
                  <ClientStepActions
                    etat={etat}
                    etude={etude}
                    isLoading={actionLoading}
                    onValiderDate={() => withAction(() => validerDateIntervention(etude.id!))}
                    onRefuserDate={() => withAction(() => refuserDateIntervention(etude.id!))}
                    onConfirmerPaiement={() => withAction(() => confirmerPaiement(etude.id!))}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Actions contextuelles CLIENT ────────────────────────────────────────────

interface ClientStepActionsProps {
  etat?: EtatEtude;
  etude: EtudeDetailDTO;
  isLoading: boolean;
  onValiderDate: () => void;
  onRefuserDate: () => void;
  onConfirmerPaiement: () => void;
}

function ClientStepActions({ etat, etude, isLoading, onValiderDate, onRefuserDate, onConfirmerPaiement }: ClientStepActionsProps) {
  const dateProposee = formatDateLong(etude.dateIntervention);

  switch (etat) {
    case 'DATE_INTERVENTION_PROPOSEE':
      /**
       * Après un refus de date, le backend remet dateIntervention à null tout en
       * maintenant l'état DATE_INTERVENTION_PROPOSEE. On attend que le BE
       * propose une nouvelle date avant d'afficher les boutons.
       */
      if (!dateProposee) {
        return (
          <InfoMsg color="orange" icon={<Clock className="w-4 h-4" />}>
            Le bureau d'études va vous proposer une nouvelle date suite à votre refus.
          </InfoMsg>
        );
      }
      return (
        <div className="space-y-3">
          <InfoMsg color="orange" icon={<Clock className="w-4 h-4" />}>
            Date proposée : <strong>{dateProposee}</strong>
          </InfoMsg>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onValiderDate} isLoading={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Valider la date
            </Button>
            <Button variant="danger" onClick={onRefuserDate} isLoading={isLoading}>
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Refuser la date
            </Button>
          </div>
        </div>
      );

    case 'RAPPORT_TERMINE':
      return (
        <Button onClick={onConfirmerPaiement} isLoading={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
          Confirmer le paiement
        </Button>
      );

    default:
      return null;
  }
}

// ─── InfoMsg ──────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  teal:   'bg-teal-50 border-teal-200 text-teal-800',
  green:  'bg-green-50 border-green-200 text-green-800',
  slate:  'bg-slate-50 border-slate-200 text-slate-700',
};

function InfoMsg({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[11px] font-medium ${COLOR_MAP[color] ?? COLOR_MAP.slate}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
