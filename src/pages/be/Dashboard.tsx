import React, { useEffect, useState } from 'react';
import { useBEDashboardData } from '../../hooks/useBEDashboardData';
import { useToast } from '../../contexts/ToastContext';
import { ETAT_LABELS, STATUT_LABELS, TYPE_LABELS } from '../../constants/labels';
import { formatDateShort } from '../../lib/formatters';
import { DemandeDevisDTO, PropositionDevisDTO, EtudeDetailDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, ChevronRight, FlaskConical, User, Clock, AlertCircle } from 'lucide-react';
import { beMustAct } from '../../components/etude/EtudeStatusBadge';
import { Link } from 'react-router-dom';

type TabType = 'OUVERT' | 'EN_ATTENTE' | 'ETUDE_EN_COURS';

export default function BEDashboard() {
  const { toastError } = useToast();
  const { demandes, allPropositionsPerDemande, myPropositions, etudes, isLoading, error } = useBEDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>('OUVERT');

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

  const myPropDemandeIds = new Set(myPropositions.map(p => p.demandeDevisId));
  const openDemandes = demandes.filter((d, i) => {
    const props = allPropositionsPerDemande[i] ?? [];
    const hasAccepted = props.some(p => p.statut === 'ACCEPTEE');
    return !myPropDemandeIds.has(d.id) && !hasAccepted;
  });
  const pendingProps = myPropositions.filter(p => p.statut === 'EN_ATTENTE');

  const renderDemandeCard = (demande: DemandeDevisDTO, prop?: PropositionDevisDTO) => (
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
          <div className="bg-blue-50/50 p-2 rounded border border-blue-100 mb-3 text-[11px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-700 font-bold uppercase tracking-wider">Votre proposition</span>
              <span className="font-bold text-slate-900 text-xs">{prop.prix} €</span>
            </div>
            <div className="text-slate-500">
              Rendu: {prop.delaiMaxRendu == null ? 'N/A' : `${prop.delaiMaxRendu} j`}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
          {demande.description || 'Aucune description fournie.'}
        </p>
      </CardContent>
      <CardFooter>
        <Link to={`/be/demande/${demande.id}`} className="w-full">
          <Button variant={prop ? "outline" : "primary"} size="sm" className="w-full group">
            {prop ? "Voir détail" : "Répondre au devis"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  const renderEtudeCard = (etude: EtudeDetailDTO) => {
    const prop = etude.propositionDevis;
    const demande = prop?.demandeDevis;
    const client = demande?.client;
    const etatInfo = etude.etat ? ETAT_LABELS[etude.etat] : null;

    return (
      <Card key={etude.id} className="border-slate-200 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center text-slate-800">
                <FlaskConical className="w-4 h-4 mr-1.5 text-slate-400" />
                {demande?.adresseProjet?.ville || 'Projet géotechnique'}
                {demande?.adresseProjet?.codePostal && (
                  <span className="text-slate-400 font-normal ml-2 text-xs">({demande.adresseProjet.codePostal})</span>
                )}
              </CardTitle>
              <CardDescription>
                {demande?.type ? TYPE_LABELS[demande.type] ?? demande.type : 'Étude géotechnique'}
              </CardDescription>
            </div>
            {etatInfo && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${etatInfo.color}`}>
                {etatInfo.label}
              </span>
            )}
          </div>
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
              <p className="font-semibold text-slate-700">{formatDateShort(demande?.delaiMax)}</p>
            </div>
            {Boolean(demande?.superficie) && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Superficie</p>
                <p className="font-semibold text-slate-700">{demande!.superficie} m²</p>
              </div>
            )}
            {Boolean(demande?.nombreLot) && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Lots</p>
                <p className="font-semibold text-slate-700">{demande!.nombreLot}</p>
              </div>
            )}
          </div>

          {/* Proposition */}
          <div className="p-2 bg-blue-50/50 rounded border border-blue-100 text-[11px]">
            <p className="text-blue-700 font-bold uppercase tracking-wider mb-1">Votre proposition</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
              <p>Montant : <span className="font-semibold">{prop?.prix == null ? '—' : `${prop.prix} €`}</span></p>
              <p>Statut : <span className="font-semibold">{prop?.statut ? (STATUT_LABELS[prop.statut] ?? prop.statut) : '—'}</span></p>
              <p>Rendu : <span className="font-semibold">{prop?.delaiMaxRendu == null ? '—' : `${prop.delaiMaxRendu} j`}</span></p>
              <p>Intervention : <span className="font-semibold">{prop?.delaiMaxIntervention == null ? '—' : `${prop.delaiMaxIntervention} j`}</span></p>
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

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {[
            { id: 'OUVERT',         label: 'Missions Disponibles', count: openDemandes.length },
            { id: 'EN_ATTENTE',     label: 'En attente',           count: pendingProps.length },
            { id: 'ETUDE_EN_COURS', label: 'Études en cours',      count: etudes.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-xs font-bold uppercase tracking-wider flex items-center
                  ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'OUVERT' && (
          openDemandes.length === 0
            ? <div className="col-span-full py-12 text-center text-slate-500">Aucune nouvelle demande correspondante.</div>
            : openDemandes.map(d => renderDemandeCard(d))
        )}
        {activeTab === 'EN_ATTENTE' && (
          pendingProps.length === 0
            ? <div className="col-span-full py-12 text-center text-slate-500">Aucune proposition en attente.</div>
            : pendingProps.map(p => {
                const d = demandes.find(d => d.id === p.demandeDevisId);
                return d ? renderDemandeCard(d, p) : null;
              })
        )}
        {activeTab === 'ETUDE_EN_COURS' && (
          etudes.length === 0
            ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p>Aucune étude en cours pour le moment.</p>
              </div>
            )
            : etudes.map(e => renderEtudeCard(e))
        )}
      </div>
    </div>
  );
}
