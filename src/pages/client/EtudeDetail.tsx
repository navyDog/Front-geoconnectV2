import React from 'react';
import { useParams } from 'react-router-dom';
import { validerDateIntervention, refuserDateIntervention, confirmerPaiement } from '../../api/etude';
import { EtudeDetailDTO, EtatEtude } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EtudeDetailLayout, EtudeDetailLoadingSpinner } from '../../components/etude/EtudeDetailLayout';
import { InfoMsg } from '../../components/etude/InfoMsg';
import { clientMustAct } from '../../components/etude/EtudeStatusBadge';
import { CheckCircle2, XCircle, CreditCard, AlertCircle, Clock, Building2 } from 'lucide-react';
import { formatDateLong } from '../../lib/formatters';
import { useEtudeDetail } from '../../hooks/useEtudeDetail';

export default function ClientEtudeDetail() {
  const { id } = useParams<{ id: string }>();
  const { etude, isLoading, actionLoading, error, withAction } = useEtudeDetail(id);

  if (isLoading) return <EtudeDetailLoadingSpinner />;
  if (!etude) return <div className="text-center text-slate-500 py-12">Étude introuvable.</div>;

  const prop   = etude.propositionDevis;
  const bureau = prop?.bureauEtude;
  const etat   = etude.etat as EtatEtude | undefined;

  const infoCard = (
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

  const actionBanner = clientMustAct(etat) && etude.dateIntervention ? (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-800 text-xs font-semibold">
      <AlertCircle className="w-4 h-4 shrink-0" />
      Une action de votre part est requise pour faire avancer ce dossier.
    </div>
  ) : undefined;

  return (
    <EtudeDetailLayout
      etude={etude}
      error={error}
      backTo="/client/dashboard?tab=ETUDES"
      headerLabel="Suivi d'étude"
      actionBanner={actionBanner}
      infoCard={infoCard}
      etatRole="CLIENT"
      renderActions={() => (
        <ClientStepActions
          etat={etat}
          etude={etude}
          isLoading={actionLoading}
          onValiderDate={() => withAction(() => validerDateIntervention(etude.id))}
          onRefuserDate={() => withAction(() => refuserDateIntervention(etude.id))}
          onConfirmerPaiement={() => withAction(() => confirmerPaiement(etude.id))}
        />
      )}
    />
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


