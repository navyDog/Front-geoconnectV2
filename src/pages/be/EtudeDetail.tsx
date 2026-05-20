import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  proposerDateIntervention,
  marquerInterventionEffectuee,
  terminerRapport,
} from '../../api/etude';
import { uploadDocument } from '../../api/document';
import { EtatEtude } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EtudeDetailLayout, EtudeDetailLoadingSpinner } from '../../components/etude/EtudeDetailLayout';
import { InfoMsg } from '../../components/etude/InfoMsg';
import { beMustAct } from '../../components/etude/EtudeStatusBadge';
import {
  CheckCircle2, Upload, AlertCircle, MapPin, Clock, User,
} from 'lucide-react';
import { useEtudeDetail } from '../../hooks/useEtudeDetail';

export default function BEEtudeDetail() {
  const { id } = useParams<{ id: string }>();
  const { etude, isLoading, actionLoading, error, withAction } = useEtudeDetail(id);

  if (isLoading) return <EtudeDetailLoadingSpinner />;
  if (!etude) return <div className="text-center text-slate-500 py-12">Étude introuvable.</div>;

  const prop    = etude.propositionDevis;
  const demande = prop?.demandeDevis;
  const client  = demande?.client;
  const etat    = etude.etat as EtatEtude | undefined;

  const infoCard = (
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
            <p className="font-bold text-slate-800">{prop?.prix == null ? '—' : `${prop.prix} €`}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Délai rendu</p>
            <p className="font-bold text-slate-800">{prop?.delaiMaxRendu == null ? '—' : `${prop.delaiMaxRendu} sem`}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const actionBanner = beMustAct(etat) ? (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-800 text-xs font-semibold">
      <AlertCircle className="w-4 h-4 shrink-0" />
      Une action de votre part est attendue pour faire avancer ce dossier.
    </div>
  ) : undefined;

  return (
    <EtudeDetailLayout
      etude={etude}
      error={error}
      backTo="/be/dashboard"
      headerLabel="Gestion d'étude"
      actionBanner={actionBanner}
      infoCard={infoCard}
      etatRole="BE"
      renderActions={() => (
        <BEStepActions
          etat={etat}
          isLoading={actionLoading}
          onProposerDate={(date) => withAction(() => proposerDateIntervention(etude.id, date))}
          onInterventionEffectuee={() => withAction(() => marquerInterventionEffectuee(etude.id))}
          onTerminerRapport={(rapportId, dateRendu) => withAction(() => terminerRapport(etude.id, rapportId, dateRendu))}
        />
      )}
    />
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

