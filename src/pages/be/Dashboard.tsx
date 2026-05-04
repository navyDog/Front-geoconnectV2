import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllDemandeDevis } from '../../api/demandeDevis';
import { getPropositionDevisByBureauId } from '../../api/propositionDevis';
import { DemandeDevisDTO, PropositionDevisDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Calendar, Clock, FileSearch, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type TabType = 'OUVERT' | 'EN_ATTENTE' | 'ACCEPTE';

export default function BEDashboard() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<DemandeDevisDTO[]>([]);
  const [propositions, setPropositions] = useState<PropositionDevisDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('OUVERT');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [allDemandes, myProps] = await Promise.all([
          getAllDemandeDevis(),
          // Assuming user.userId maps to bureauId for MVP
          getPropositionDevisByBureauId(user.userId).catch(() => [])
        ]);
        
        setDemandes(allDemandes || []);
        setPropositions(myProps || []);
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
  const myPropDemandeIds = propositions.map(p => p.demandeDevisId);
  const openDemandes = demandes.filter(d => !myPropDemandeIds.includes(d.id));
  
  // Note: the backend might need an identifier to know if accepted. For this MVP we'll pretend it's in the PropositionDevisDTO if refusee === false and handled by Etude natively.
  // We'll approximate:
  const pendingProps = propositions.filter(p => p.refusee !== false && (p as any).accepted !== true);
  const acceptedProps = propositions.filter(p => (p as any).accepted === true); // Based on how frontend sets it, or if backend exposes an 'accepted' field.

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
              Ouvert le {demande.dateCreation ? format(new Date(demande.dateCreation), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
            </CardDescription>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
            {demande.typeProjet || 'Général'}
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
              Rendu: {prop.dateRendu ? format(new Date(prop.dateRendu), 'dd/MM/yyyy') : 'N/A'}
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
            { id: 'OUVERT', label: 'Missions Disponibles', count: openDemandes.length },
            { id: 'EN_ATTENTE', label: 'En attente', count: pendingProps.length },
            { id: 'ACCEPTE', label: 'Affaires conclues', count: acceptedProps.length }
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
          openDemandes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Aucune nouvelle demande correspondante.</div>
          ) : (
            openDemandes.map(d => renderDemandeCard(d))
          )
        )}
        {activeTab === 'EN_ATTENTE' && (
          pendingProps.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Aucune proposition en attente.</div>
          ) : (
            pendingProps.map(p => {
              const d = demandes.find(d => d.id === p.demandeDevisId);
              return d ? renderDemandeCard(d, p) : null;
            })
          )
        )}
        {activeTab === 'ACCEPTE' && (
          acceptedProps.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Aucune affaire conclue pour le moment.</div>
          ) : (
            acceptedProps.map(p => {
              const d = demandes.find(d => d.id === p.demandeDevisId);
              return d ? renderDemandeCard(d, p) : null;
            })
          )
        )}
      </div>

    </div>
  );
}
