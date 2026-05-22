import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { EtatEtude } from '../../types';

// ─── Définition des étapes ────────────────────────────────────────────────────

export interface StepDef {
  etat: EtatEtude;
  label: string;
  descriptionClient: string;
  descriptionBE: string;
}

export const ETUDE_STEPS: StepDef[] = [
  {
    etat: 'DEVIS_VALIDE',
    label: 'Devis accepté',
    descriptionClient: "Votre proposition de devis a été validée. Le bureau d'études va proposer une date d'intervention.",
    descriptionBE: "Le client a accepté votre devis. Proposez une date d'intervention pour démarrer l'étude.",
  },
  {
    etat: 'DATE_INTERVENTION_PROPOSEE',
    label: "Date d'intervention",
    descriptionClient: "Le bureau d'études a soumis une date. Validez ou refusez-la pour continuer.",
    descriptionBE: "En attente de la confirmation de date par le client.",
  },
  {
    etat: 'DATE_INTERVENTION_FIXEE',
    label: "Date confirmée",
    descriptionClient: "La date d'intervention est confirmée. Vous serez informé une fois l'intervention réalisée.",
    descriptionBE: "La date est validée par le client. Réalisez l'intervention puis signalez-la.",
  },
  {
    etat: 'INTERVENTION_EFFECTUEE',
    label: "Intervention réalisée",
    descriptionClient: "L'intervention terrain est terminée. Le rapport est en cours de rédaction.",
    descriptionBE: "L'intervention est effectuée. Uploadez le rapport final et indiquez sa date de remise.",
  },
  {
    etat: 'RAPPORT_TERMINE',
    label: "Rapport disponible",
    descriptionClient: "Le rapport final est prêt. Confirmez le paiement pour clôturer le dossier.",
    descriptionBE: "Le rapport a été transmis. En attente de la confirmation de paiement du client.",
  },
  {
    etat: 'PAIEMENT_EFFECTUE',
    label: "Dossier clôturé",
    descriptionClient: "Le paiement a été confirmé. Merci pour votre confiance.",
    descriptionBE: "Le paiement a été confirmé par le client. Dossier clôturé.",
  },
];

const STEP_INDEX: Record<EtatEtude, number> = {
  DEVIS_VALIDE: 0,
  DATE_INTERVENTION_PROPOSEE: 1,
  DATE_INTERVENTION_FIXEE: 2,
  INTERVENTION_EFFECTUEE: 3,
  RAPPORT_TERMINE: 4,
  PAIEMENT_EFFECTUE: 5,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'CLIENT' | 'BE';

interface EtudeStepperProps {
  etat?: EtatEtude;
  role: Role;
  /** Contenu action rendu à l'intérieur de l'étape active */
  renderActions?: (step: StepDef, index: number) => React.ReactNode;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export const EtudeStepper: React.FC<EtudeStepperProps> = ({ etat, role, renderActions }) => {
  const currentIndex = etat !== undefined ? STEP_INDEX[etat] : -1;

  return (
    <div className="relative">
      {ETUDE_STEPS.map((step, index) => {
        const isLast      = index === ETUDE_STEPS.length - 1;
        const isCompleted = index < currentIndex || (isLast && index === currentIndex);
        const isCurrent   = index === currentIndex && !isLast;
        const isPending   = index > currentIndex;

        const description = role === 'CLIENT' ? step.descriptionClient : step.descriptionBE;
        const actions = isCurrent && renderActions ? renderActions(step, index) : null;

        return (
          <div key={step.etat} className="flex gap-4">
            {/* Colonne gauche : indicateur + ligne verticale */}
            <div className="flex flex-col items-center">
              {/* Cercle d'état */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${isCurrent  ? 'bg-white border-blue-600 text-blue-600 shadow-md' : ''}
                  ${isPending  ? 'bg-white border-slate-200 text-slate-300' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className={`text-[10px] font-black ${isCurrent ? 'text-blue-600' : 'text-slate-300'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              {/* Ligne verticale */}
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[1.5rem] my-1 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>

            {/* Colonne droite : contenu */}
            <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
              {/* Label */}
              <p className={`text-xs font-bold uppercase tracking-wider leading-none mb-1 ${
                isCurrent  ? 'text-blue-700' :
                isCompleted ? 'text-green-600' :
                'text-slate-400'
              }`}>
                {step.label}
              </p>

              {/* Description */}
              {(isCurrent || isCompleted) && (
                <p className={`text-[11px] leading-relaxed mb-2 ${isCurrent ? 'text-slate-600' : 'text-slate-400'}`}>
                  {description}
                </p>
              )}

              {/* Actions de l'étape active */}
              {actions && (
                <div className="mt-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

