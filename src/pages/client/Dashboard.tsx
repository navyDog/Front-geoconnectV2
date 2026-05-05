import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDemandeDevisByClientId } from '../../api/demandeDevis';
import { getPropositionDevisByDemandeId } from '../../api/propositionDevis';
import { getAllClients } from '../../api/client';
import { DemandeDevisDTO, PropositionDevisDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Calendar, Clock, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<(DemandeDevisDTO & { propositions?: PropositionDevisDTO[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const clients = await getAllClients();
        const myClient = clients.find(c => c.utilisateurId === user.userId);
        
        if (!myClient || myClient.id === undefined) {
             setDemandes([]);
             setIsLoading(false);
             return;
        }

        const demandesData = await getDemandeDevisByClientId(myClient.id);
        
        // Fetch propositions for each demande
        const enrichedDemandes = await Promise.all(
          demandesData.map(async (d) => {
            try {
              const props = await getPropositionDevisByDemandeId(d.id!);
              return { ...d, propositions: props || [] };
            } catch (e) {
              return { ...d, propositions: [] };
            }
          })
        );
        
        setDemandes(enrichedDemandes);
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
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const totalDemandes = demandes.length;
  const totalPropositions = demandes.reduce((acc, d) => acc + (d.propositions?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Mes Demandes en Cours</h1>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Aperçu et suivi des devis</p>
        </div>
        <div className="flex space-x-3 items-center">
          <Link to="/client/demande/new">
            <Button size="sm" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 rounded px-3 text-[11px] uppercase tracking-wider font-bold">
              Nouvelle demande
            </Button>
          </Link>
          <div className="bg-slate-50 border border-slate-100 rounded px-3 py-1.5 flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demandes</p>
              <p className="text-sm font-bold text-slate-900">{totalDemandes}</p>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Propositions</p>
              <p className="text-sm font-bold text-blue-600">{totalPropositions}</p>
            </div>
          </div>
        </div>
      </div>

      {demandes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune demande trouvée</h3>
            <p className="text-slate-500 mb-6">Vous n'avez pas encore publié de demande de devis.</p>
            <Link to="/">
              <Button>Créer une demande</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
          {demandes.map(demande => {
            const hasAcceptedProp = demande.propositions?.some(p => p.refusee === false); // Need actual state for accepted
            const propsCount = demande.propositions?.length || 0;

            return (
              <Card key={demande.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400"/>
                        {demande.adresseProjet?.ville || 'Ville non spécifiée'}
                        <span className="text-slate-400 font-normal ml-2 text-xs">
                          ({demande.adresseProjet?.codePostal || ''})
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1"/>
                        Publiée le {demande.dateCreation ? format(new Date(demande.dateCreation), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                      </CardDescription>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
                        {demande.typeProjet || 'Projet'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {demande.description || 'Projet de construction/rénovation sans description détaillée.'}
                  </p>
                  <div className="flex items-center text-xs text-slate-500 mb-2">
                    <Clock className="w-3 h-3 mr-1.5" />
                    Délai max: {demande.delaiMax ? format(new Date(demande.delaiMax), 'dd/MM/yyyy') : 'Non précisé'}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 mt-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Propositions reçues</span>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-bold">
                      {propsCount}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={`/client/demande/${demande.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full group">
                      Voir les détails <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
