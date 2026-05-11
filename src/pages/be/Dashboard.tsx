import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllDemandeDevis } from '../../api/demandeDevis';
import { getPropositionDevisByBureauId } from '../../api/propositionDevis';
import { getAllBureauEtude } from '../../api/bureauEtude';
import { getEtudesByBureauId } from '../../api/etude';
import { DemandeDevisDTO, PropositionDevisDTO, EtudeDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, ChevronRight, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';

type TabType = 'OUVERT' | 'EN_ATTENTE' | 'ETUDE_EN_COURS';

// Mapping des états pour affichage
const ETAT_LABELS: Record<string, { label: string; color: string }> = {
  DEVIS_VALIDE:                 { label: 'Devis validé',               color: 'bg-blue-100 text-blue-700' },
  DATE_INTERVENTION_PROPOSEE:   { label: 'Date proposée',              color: 'bg-yellow-100 text-yellow-700' },
  DATE_INTERVENTION_FIXEE:      { label: 'Date fixée',                 color: 'bg-orange-100 text-orange-700' },
  INTERVENTION_EFFECTUEE:       { label: 'Intervention effectuée',     color: 'bg-purple-100 text-purple-700' },
  RAPPORT_TERMINE:              { label: 'Rapport terminé',            color: 'bg-teal-100 text-teal-700' },
  PAIEMENT_EFFECTUE:            { label: 'Paiement effectué',          color: 'bg-green-100 text-green-700' },
};

export default function BEDashboard() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<DemandeDevisDTO[]>([]);
  const [propositions, setPropositions] = useState<PropositionDevisDTO[]>([]);
  const [etudes, setEtudes] = useState<EtudeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('OUVERT');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const bureaux = await getAllBureauEtude();
        const myBureau = bureaux.find(b => b.utilisateurId === user.userId);

        const [allDemandes, myProps, myEtudes] = await Promise.all([
          getAllDemandeDevis(),
          myBureau?.id ? getPropositionDevisByBureauId(myBureau.id).catch(() => []) : Promise.resolve([]),
          myBureau?.id ? getEtudesByBureauId(myBureau.id).catch(() => [])           : Promise.resolve([]),
        ]);

        setDemandes(allDemandes || []);
        setPropositions(myProps || []);
        setEtudes(myEtudes || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derive lists
  const myPropDemandeIds = new Set(propositions.map(p => p.demandeDevisId));
  const openDemandes = demandes.filter(d => !myPropDemandeIds.has(d.id));
  const pendingProps = propositions.filter(p => p.statut === 'EN_ATTENTE');

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
              Réf. #GC-{demande.id}
            </CardDescription>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
            {demande.type || 'Général'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {prop ? (
          <div className="bg-blue-50/50 p-2 rounded border border-blue-100 mb-3 text-[11px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-700 font-bold uppercase tracking-wider">Votre proposition</span>
              <span className="font-bold text-slate-900 text-xs">{prop.prix} €</span>
            </div>
            <div className="text-slate-500">
              Rendu: {prop.delaiMaxRendu == null ? 'N/A' : `${prop.delaiMaxRendu} j`}
            </div>
          </div>
        ) : null}
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

  const renderEtudeCard = (etude: EtudeDTO) => {
    const prop = propositions.find(p => p.id === etude.propositionDevisId);
    const demande = prop ? demandes.find(d => d.id === prop.demandeDevisId) : undefined;
    const etatInfo = etude.etat ? ETAT_LABELS[etude.etat] : null;

    return (
      <Card key={etude.id} className="border-slate-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center text-slate-800">
                <FlaskConical className="w-4 h-4 mr-1.5 text-slate-400" />
                {demande?.adresseProjet?.ville || 'Projet'}
              </CardTitle>
              <CardDescription>
                {demande?.type || 'Étude géotechnique'}
              </CardDescription>
            </div>
            {etatInfo && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${etatInfo.color}`}>
                {etatInfo.label}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2 text-xs text-slate-600">
          <p className="line-clamp-2">{demande?.description || 'Aucune description.'}</p>
          {prop && (
            <div className="mt-3 flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Montant devis</span>
              <span className="font-bold text-slate-900">{prop.prix} €</span>
            </div>
          )}
        </CardContent>
        {demande && (
          <CardFooter>
            <Link to={`/be/demande/${demande.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full group">
                Voir le dossier <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
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
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 text-xs font-bold uppercase tracking-wider flex items-center
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }
                `}
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
