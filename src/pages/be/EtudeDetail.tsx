import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEtudeDetailById,
  proposerDateIntervention,
  marquerInterventionEffectuee,
  terminerRapport,
} from '../../api/etude';
import { uploadDocument, openDocument } from '../../api/document';
import { EtudeDetailDTO, EtatEtude } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EtudeStatusBadge, beMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeStepper } from '../../components/etude/EtudeStepper';
import {
  ChevronLeft, MapPin, User, FileText,
  CheckCircle2, XCircle, Upload, AlertCircle, Download, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_LABELS: Record<string, string> = {
  G1:     'G1 — Étude de site',
  G2_AVP: 'G2 AVP — Avant-projet',
  G2_PRO: 'G2 PRO — Projet',
};

const formatDate = (value?: string): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'dd MMMM yyyy', { locale: fr });
};

export default function BEEtudeDetail() {
  const { id } = useParams<{ id: string }>();
  const [etude, setEtude] = useState<EtudeDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const client  = demande?.client;
  const etat    = etude.etat as EtatEtude | undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link
        to="/be/dashboard"
        className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-3 h-3 mr-1" />
        Retour au tableau de bord
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gestion d'étude #{etude.id}</p>
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
      {beMustAct(etat) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Une action de votre part est attendue pour faire avancer ce dossier.
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
                <User className="w-3 h-3" /> Client commanditaire
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-1.5 text-xs">
              {client ? (
                <>
                  <p className="font-bold text-slate-800">
                    {[client.prenom, client.nom].filter(Boolean).join(' ') || '—'}
                  </p>
                  {client.tel && <p className="text-slate-500">{client.tel}</p>}
                  {client.adresseFacturation?.ville && (
                    <p className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {client.adresseFacturation.ville}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-400">Informations non disponibles.</p>
              )}
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
                <span className="font-semibold text-slate-800">{formatDate(etude.dateIntervention) ?? '—'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rendu</span>
                <span className="font-semibold text-slate-800">{formatDate(etude.dateRendu) ?? '—'}</span>
              </div>
              {etude.rapportId != null && (
                <button
                  onClick={() => openDocument(etude.rapportId!)}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-[11px] transition-colors mt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Voir le rapport
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
                role="BE"
                renderActions={() => (
                  <BEStepActions
                    etat={etat}
                    isLoading={actionLoading}
                    onProposerDate={(date) => withAction(() => proposerDateIntervention(etude.id!, date))}
                    onInterventionEffectuee={() => withAction(() => marquerInterventionEffectuee(etude.id!))}
                    onTerminerRapport={(rapportId, dateRendu) => withAction(() => terminerRapport(etude.id!, rapportId, dateRendu))}
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

// ─── Actions contextuelles BE ─────────────────────────────────────────────────

interface BEStepActionsProps {
  etat?: EtatEtude;
  isLoading: boolean;
  onProposerDate: (date: string) => void;
  onInterventionEffectuee: () => void;
  onTerminerRapport: (rapportId: number, dateRendu: string) => void;
}

function BEStepActions({ etat, isLoading, onProposerDate, onInterventionEffectuee, onTerminerRapport }: BEStepActionsProps) {
  const [dateInput, setDateInput] = useState('');
  const [rapportFile, setRapportFile] = useState<File | null>(null);
  const [dateRenduInput, setDateRenduInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleTerminerRapport = async () => {
    if (!rapportFile || !dateRenduInput) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(rapportFile);
      if (doc.id) onTerminerRapport(doc.id, dateRenduInput);
    } finally {
      setUploading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  switch (etat) {
    case 'DEVIS_VALIDE':
    case 'DATE_INTERVENTION_PROPOSEE':
      return (
        <div className="space-y-3">
          {etat === 'DATE_INTERVENTION_PROPOSEE' && (
            <InfoMsg color="orange" icon={<Clock className="w-4 h-4" />}>
              Le client n'a pas encore validé votre date. Vous pouvez en proposer une nouvelle.
            </InfoMsg>
          )}
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Date d'intervention
              </label>
              <input
                type="date"
                value={dateInput}
                min={today}
                onChange={e => setDateInput(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button onClick={() => onProposerDate(dateInput)} disabled={!dateInput} isLoading={isLoading}>
              Envoyer la date
            </Button>
          </div>
        </div>
      );

    case 'DATE_INTERVENTION_FIXEE':
      return (
        <Button onClick={onInterventionEffectuee} isLoading={isLoading}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Marquer l'intervention effectuée
        </Button>
      );

    case 'INTERVENTION_EFFECTUEE':
      return (
        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Rapport final (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setRapportFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Date de remise du rapport
            </label>
            <input
              type="date"
              value={dateRenduInput}
              onChange={e => setDateRenduInput(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={handleTerminerRapport}
            disabled={!rapportFile || !dateRenduInput}
            isLoading={isLoading || uploading}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Terminer le rapport
          </Button>
        </div>
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
