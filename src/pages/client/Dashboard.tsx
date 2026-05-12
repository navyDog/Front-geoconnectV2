import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDemandeDevisByClientId } from '../../api/demandeDevis';
import { getPropositionDevisByDemandeId } from '../../api/propositionDevis';
import { getAllClients } from '../../api/client';
import { getEtudesByClientId, getEtudeDetailById } from '../../api/etude';
import { DemandeDevisDTO, PropositionDevisDTO, EtudeDTO, EtudeDetailDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Calendar, Clock, FileText, ChevronRight, FlaskConical, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

type TabType = 'DEMANDES' | 'ETUDES';

const ETAT_LABELS: Record<string, { label: string; color: string }> = {
  DEVIS_VALIDE:               { label: 'Devis validé',            color: 'bg-blue-100 text-blue-700' },
  DATE_INTERVENTION_PROPOSEE: { label: 'Date proposée',           color: 'bg-yellow-100 text-yellow-700' },
  DATE_INTERVENTION_FIXEE:    { label: 'Date fixée',              color: 'bg-orange-100 text-orange-700' },
  INTERVENTION_EFFECTUEE:     { label: 'Intervention effectuée',  color: 'bg-purple-100 text-purple-700' },
  RAPPORT_TERMINE:            { label: 'Rapport terminé',         color: 'bg-teal-100 text-teal-700' },
  PAIEMENT_EFFECTUE:          { label: 'Paiement effectué',       color: 'bg-green-100 text-green-700' },
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTEE:   'Acceptée',
  REFUSEE:    'Refusée',
};

const TYPE_LABELS: Record<string, string> = {
  G1:      'G1 — Étude de site',
  G2_AVP:  'G2 AVP — Avant-projet',
  G2_PRO:  'G2 PRO — Projet',
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<(DemandeDevisDTO & { propositions?: PropositionDevisDTO[] })[]>([]);
  const [etudes, setEtudes] = useState<EtudeDetailDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('DEMANDES');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const clients = await getAllClients();
        const myClient = clients.find(c => c.utilisateurId === user.userId);

        if (!myClient?.id) { setIsLoading(false); return; }

        const demandesData = await getDemandeDevisByClientId(myClient.id);

        const [enrichedDemandes, rawEtudes] = await Promise.all([
          Promise.all(
            demandesData.map(async (d) => {
              try {
                const props = await getPropositionDevisByDemandeId(d.id!);
                return { ...d, propositions: props || [] };
              } catch {
                return { ...d, propositions: [] };
              }
            })
          ),
          getEtudesByClientId(myClient.id).catch(() => []),
        ]);

        setDemandes(enrichedDemandes);

        // Charger le détail complet de chaque étude via le nouvel endpoint
        const details = await Promise.all(
          (rawEtudes || []).map((e: EtudeDTO) =>
            e.id ? getEtudeDetailById(e.id).catch(() => ({ ...e } as EtudeDetailDTO)) : Promise.resolve({ ...e } as EtudeDetailDTO)
          )
        );
        setEtudes(details);
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
  const demandesEnCours = demandes.filter(d => !d.propositions?.some(p => p.statut === 'ACCEPTEE'));

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'dd/MM/yyyy');
  };

  // Statistiques sur les études
  const etudesTotales = etudes.length;
  const etudesTerminees = etudes.filter(e => e.etat === 'RAPPORT_TERMINE').length;
  const etudesEnCours = etudes.filter(e =>
    e.etat && e.etat !== 'RAPPORT_TERMINE' && e.etat !== 'PAIEMENT_EFFECTUE'
  ).length;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Mon Espace</h1>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Géotechnique - Suivi des études</p>
        </div>
        <div className="flex space-x-3 items-center">
          <Link to="/client/demande/new">
            <Button size="sm" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 rounded px-3 text-[11px] uppercase tracking-wider font-bold">
              Nouvelle demande
            </Button>
          </Link>
          <div className="bg-slate-50 border border-slate-100 rounded px-3 py-1.5 flex items-center gap-3">
            <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Études Totales</p>
             <p className="text-sm font-bold text-teal-600">{etudesTotales}</p>

            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Cours</p>
             <p className="text-sm font-bold text-orange-600">{etudesEnCours}</p>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terminées</p>
              <p className="text-sm font-bold text-green-600">{etudesTerminees}</p>

            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {[
            { id: 'DEMANDES', label: 'Mes Demandes',    count: demandesEnCours.length },
            { id: 'ETUDES',   label: 'Études en cours', count: etudes.length },
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

      {/* Onglet Demandes */}
      {activeTab === 'DEMANDES' && (
        demandesEnCours.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune demande trouvée</h3>
              <p className="text-slate-500 mb-6">Vous n'avez pas encore publié de demande de devis.</p>
              <Link to="/"><Button>Créer une demande</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
            {demandesEnCours.map(demande => {
              const propsCount = demande.propositions?.length || 0;
              return (
                <Card key={demande.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400"/>
                          {demande.adresseProjet?.ville || 'Ville non spécifiée'}
                          <span className="text-slate-400 font-normal ml-2 text-xs">({demande.adresseProjet?.codePostal || ''})</span>
                        </CardTitle>
                        <CardDescription className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1"/>
                          Réf. #MES-{demande.id}
                        </CardDescription>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
                        {demande.type || 'Projet'}
                      </span>
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
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-bold">{propsCount}</span>
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
        )
      )}

      {/* Onglet Études */}
      {activeTab === 'ETUDES' && (
        etudes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
                <FlaskConical className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune étude en cours</h3>
              <p className="text-slate-500">Acceptez une proposition de devis pour démarrer une étude.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
            {etudes.map(etude => {
              const prop = etude.propositionDevis;
              const demande = prop?.demandeDevis;
              const bureau = prop?.bureauEtude;
              const etatInfo = etude.etat ? ETAT_LABELS[etude.etat] : null;
              return (
                <Card key={etude.id} className="flex flex-col border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center">
                          <FlaskConical className="w-3.5 h-3.5 mr-1 text-slate-400"/>
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
                  <CardContent className="pt-2 space-y-3 flex-1">
                    <p className="text-xs text-slate-600 line-clamp-2">{demande?.description || 'Aucune description.'}</p>

                    {/* Bureau d'études attributaire */}
                    {bureau && (
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Bureau :</span>
                        <span className="font-semibold text-slate-700">{bureau.raisonSociale || '—'}</span>
                      </div>
                    )}

                    {/* Infos demande */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Réf. projet</p>
                        <p className="text-slate-700 font-semibold">{demande?.id ? `#MES-${demande.id}` : '—'}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Délai souhaité</p>
                        <p className="text-slate-700 font-semibold">{formatDate(demande?.delaiMax)}</p>
                      </div>
                    </div>

                    {/* Proposition retenue */}
                    <div className="p-2 bg-blue-50/60 rounded border border-blue-100 text-[11px]">
                      <p className="text-blue-700 font-bold uppercase tracking-wider mb-1">Offre retenue</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
                        <p>Montant : <span className="font-semibold">{prop?.prix != null ? `${prop.prix} €` : '—'}</span></p>
                        <p>Statut : <span className="font-semibold">{prop?.statut ? (STATUT_LABELS[prop.statut] ?? prop.statut) : '—'}</span></p>
                        <p>Rendu : <span className="font-semibold">{prop?.delaiMaxRendu != null ? `${prop.delaiMaxRendu} j` : '—'}</span></p>
                        <p>Intervention : <span className="font-semibold">{prop?.delaiMaxIntervention != null ? `${prop.delaiMaxIntervention} j` : '—'}</span></p>
                      </div>
                    </div>
                  </CardContent>
                  {demande?.id && (
                    <CardFooter>
                      <Link to={`/client/demande/${demande.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full group">
                          Voir le dossier <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
