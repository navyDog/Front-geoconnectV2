import React, { useEffect, useState } from 'react';
import { useBEDashboardData } from '../../hooks/useBEDashboardData';
import { useToast } from '../../contexts/ToastContext';
import { STATUT_LABELS } from '../../constants/labels';
import { formatDateShort } from '../../lib/formatters';
import { DemandeDevisDTO, PropositionDevisDTO, EtudeDetailDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, ChevronRight, FlaskConical, User, Clock, AlertCircle, Archive } from 'lucide-react';
import { beMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeCardHeader } from '../../components/etude/EtudeCardHeader';
import { DashboardTabNav } from '../../components/ui/DashboardTabNav';
import { Link, useSearchParams } from 'react-router-dom';

type TabType = 'OUVERT' | 'EN_ATTENTE' | 'ETUDE_EN_COURS' | 'ARCHIVES';

// ─── État vide pour les onglets études dans la grille BE ──────────────────────

function EtudesGridEmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="col-span-full py-12 text-center text-slate-500">
      {icon}
      <p>{text}</p>
    </div>
  );
}

export default function BEDashboard() {
  const { toastError } = useToast();
  const { demandes, allPropositionsPerDemande, myPropositions, etudes, isLoading, error } = useBEDashboardData();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam ?? 'OUVERT');

  // Synchronise l'onglet si le param URL change (ex : retour arrière)
  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    if (error) toastError(error);
  }, [error, toastError]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Demandes pour lesquelles une proposition a été acceptée (toutes confondues)
  const acceptedDemandeIds = new Set<number>();
  demandes.forEach((d, i) => {
    if ((allPropositionsPerDemande[i] ?? []).some(p => p.statut === 'ACCEPTEE')) {
      if (d.id != null) acceptedDemandeIds.add(d.id);
    }
  });

  // Pour chaque demandeDevisId, on groupe mes propositions et on retient la "active"
  // EN_ATTENTE > ACCEPTEE > REFUSEE (dernière en date)
  const myPropsPerDemande = new Map<number, PropositionDevisDTO[]>();
  myPropositions.forEach(p => {
    if (p.demandeDevisId != null) {
      if (!myPropsPerDemande.has(p.demandeDevisId)) myPropsPerDemande.set(p.demandeDevisId, []);
      myPropsPerDemande.get(p.demandeDevisId).push(p);
    }
  });
  const myActivePropPerDemande = new Map<number, PropositionDevisDTO>();
  myPropsPerDemande.forEach((props, demandeId) => {
    const active =
      props.find(p => p.statut === 'EN_ATTENTE') ??
      props.find(p => p.statut === 'ACCEPTEE') ??
      props.at(-1);
    if (active) myActivePropPerDemande.set(demandeId, active);
  });

  const myPropDemandeIds = new Set(myPropositions.map(p => p.demandeDevisId));
  const openDemandes = demandes.filter((d, i) => {
    const props = allPropositionsPerDemande[i] ?? [];
    const hasAccepted = props.some(p => p.statut === 'ACCEPTEE');
    return !myPropDemandeIds.has(d.id) && !hasAccepted;
  });

  // "En attente" = mes offres EN_ATTENTE + mes offres REFUSÉE reproposables (pas d'acceptée sur la demande)
  const pendingItems = [...myActivePropPerDemande.entries()].filter(([demandeId, prop]) => {
    if (prop.statut === 'EN_ATTENTE') return true;
    if (prop.statut === 'REFUSEE' && !acceptedDemandeIds.has(demandeId)) return true;
    return false;
  });

  const etudesEnCours   = etudes.filter(e => e.etat !== 'PAIEMENT_EFFECTUE');
  const etudesArchivees = etudes.filter(e => e.etat === 'PAIEMENT_EFFECTUE');

  const renderDemandeCard = (demande: DemandeDevisDTO, prop?: PropositionDevisDTO) => {
    const isRefused = prop?.statut === 'REFUSEE';
    return (
    <Card key={demande.id} className={prop ? "border-slate-200" : "border-blue-200"}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center text-blue-600">
              {demande.adresseProjet?.ville || 'Localisation N/A'}
            </CardTitle>
            <CardDescription className="flex items-center">
              <Calendar className="w-3 h-3 mr-1"/>
              Réf. #MES-{demande.id}
            </CardDescription>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
            {demande.type || 'Général'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {prop && (
          <div className={`p-2 rounded border mb-3 text-[11px] ${isRefused ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`font-bold uppercase tracking-wider ${isRefused ? 'text-red-600' : 'text-blue-700'}`}>
                {isRefused ? 'Offre refusée — à reproposer' : 'Votre proposition'}
              </span>
              <span className="font-bold text-slate-900 text-xs">{prop.prix} €</span>
            </div>
            <div className="text-slate-500">
              Rendu: {prop.delaiMaxRendu == null ? 'N/A' : `${prop.delaiMaxRendu} sem`}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
          {demande.description || 'Aucune description fournie.'}
        </p>
      </CardContent>
      <CardFooter>
        <Link to={`/be/demande/${demande.id}`} className="w-full">
          <Button variant={prop ? "outline" : "primary"} size="sm" className={`w-full group ${isRefused ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}`}>
            {isRefused ? 'Reproposer une offre' : prop ? 'Voir détail' : 'Répondre au devis'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
    );
  };

  const renderEtudeCard = (etude: EtudeDetailDTO) => {
    const prop    = etude.propositionDevis;
    const demande = prop?.demandeDevis;
    const client  = demande?.client;

    return (
      <Card key={etude.id} className="border-slate-200 flex flex-col">
        <CardHeader>
          <EtudeCardHeader demande={demande} etat={etude.etat} />
        </CardHeader>
        <CardContent className="pt-2 text-xs text-slate-600 space-y-3 flex-1">
          {/* Description */}
          <p className="line-clamp-2">{demande?.description || 'Aucune description.'}</p>

          {/* Client commanditaire */}
          {client && (
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Client :</span>
              <span className="font-semibold text-slate-700">
                {[client.prenom, client.nom].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
          )}

          {/* Infos demande */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider">Réf. projet</p>
              <p className="font-semibold text-slate-700">{demande?.id ? `#MES-${demande.id}` : '—'}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider">Délai client</p>
              <p className="font-semibold text-slate-700">{demande?.delaiMaxSouhaite == null ? '—' : `${demande.delaiMaxSouhaite} sem`}</p>
            </div>
            {Boolean(demande?.superficie) && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Superficie</p>
                <p className="font-semibold text-slate-700">{demande.superficie} m²</p>
              </div>
            )}
            {Boolean(demande?.nombreLot) && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Lots</p>
                <p className="font-semibold text-slate-700">{demande.nombreLot}</p>
              </div>
            )}
          </div>

          {/* Proposition */}
          <div className="p-2 bg-blue-50/50 rounded border border-blue-100 text-[11px]">
            <p className="text-blue-700 font-bold uppercase tracking-wider mb-1">Votre proposition</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
              <p>Montant : <span className="font-semibold">{prop?.prix == null ? '—' : `${prop.prix} €`}</span></p>
              <p>Statut : <span className="font-semibold">{prop?.statut ? (STATUT_LABELS[prop.statut] ?? prop.statut) : '—'}</span></p>
              <p>Rendu : <span className="font-semibold">{prop?.delaiMaxRendu == null ? '—' : `${prop.delaiMaxRendu} sem`}</span></p>
              <p>Intervention : <span className="font-semibold">{prop?.delaiMaxIntervention == null ? '—' : `${prop.delaiMaxIntervention} sem`}</span></p>
            </div>
          </div>

          {/* Dates étude */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/>Intervention</p>
              <p className="font-semibold text-slate-700">{formatDateShort(etude.dateIntervention)}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/>Rendu</p>
              <p className="font-semibold text-slate-700">{formatDateShort(etude.dateRendu)}</p>
            </div>
          </div>
        </CardContent>
        {Boolean(demande?.id) && (
          <CardFooter>
            <Link to={`/be/etude/${etude.id}`} className="w-full">
              <Button
                variant="outline"
                size="sm"
                className={`w-full group ${beMustAct(etude.etat) ? 'border-orange-400 text-orange-700 hover:bg-orange-50' : ''}`}
              >
                {beMustAct(etude.etat) && <AlertCircle className="w-3 h-3 mr-1.5 text-orange-500" />}
                Gérer l'étude <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Opportunités</h1>
          <p className="text-slate-500">Gérez vos réponses aux demandes de devis.</p>
        </div>
      </div>

      <DashboardTabNav
        activeTab={activeTab}
        onTabChange={(id) => handleTabChange(id as TabType)}
        tabs={[
          { id: 'OUVERT',         label: 'Missions Disponibles', count: openDemandes.length },
          { id: 'EN_ATTENTE',     label: 'En attente',           count: pendingItems.length },
          { id: 'ETUDE_EN_COURS', label: 'Études en cours',      count: etudesEnCours.length },
          { id: 'ARCHIVES',       label: 'Études archivées',      count: etudesArchivees.length },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'OUVERT' && (
          openDemandes.length === 0
            ? <div className="col-span-full py-12 text-center text-slate-500">Aucune nouvelle demande correspondante.</div>
            : openDemandes.map(d => renderDemandeCard(d))
        )}
        {activeTab === 'EN_ATTENTE' && (
          pendingItems.length === 0
            ? <div className="col-span-full py-12 text-center text-slate-500">Aucune proposition en attente.</div>
            : pendingItems.map(([demandeId, p]) => {
                const d = demandes.find(d => d.id === demandeId);
                return d ? renderDemandeCard(d, p) : null;
              })
        )}
        {activeTab === 'ETUDE_EN_COURS' && (
          etudesEnCours.length === 0
            ? <EtudesGridEmptyState icon={<FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-3" />} text="Aucune étude en cours pour le moment." />
            : etudesEnCours.map(e => renderEtudeCard(e))
        )}
        {activeTab === 'ARCHIVES' && (
          etudesArchivees.length === 0
            ? <EtudesGridEmptyState icon={<Archive className="w-8 h-8 text-slate-300 mx-auto mb-3" />} text="Aucune étude archivée pour le moment." />
            : etudesArchivees.map(e => renderEtudeCard(e))
        )}
      </div>
    </div>
  );
}
