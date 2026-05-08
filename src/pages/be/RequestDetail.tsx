import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDemandeDevisById } from '../../api/demandeDevis';
import { getPropositionDevisByDemandeId, createPropositionDevis } from '../../api/propositionDevis';
import { getAllBureauEtude } from '../../api/bureauEtude';
import { DemandeDevisDTO, PropositionDevisDTO, BureauEtudesDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MapPin, Clock, ChevronLeft, FileCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BERequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [demande, setDemande] = useState<DemandeDevisDTO | null>(null);
  const [myProposition, setMyProposition] = useState<PropositionDevisDTO | null>(null);
  const [myBureau, setMyBureau] = useState<BureauEtudesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    async function fetchData() {
      if (!id || !user) return;
      try {
        const bureaux = await getAllBureauEtude();
        const bureau = bureaux.find(b => b.utilisateurId === user.userId);
        if (bureau) setMyBureau(bureau);

        const [demandeData, propsData] = await Promise.all([
          getDemandeDevisById(Number(id)),
          getPropositionDevisByDemandeId(Number(id)).catch(() => [])
        ]);
        setDemande(demandeData);
        
        // Find if this BE has already submitted
        if (bureau?.id) {
          const mine = (propsData || []).find((p: PropositionDevisDTO) => p.bureauEtudeId === bureau.id);
          if (mine) setMyProposition(mine);
        }

      } catch (err) {
        console.error("Failed to fetch detail", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user]);

  const onSubmit = async (data: any) => {
    if (!demande || !user || !myBureau?.id) return;
    setIsSubmitting(true);
    try {
      const newProp = await createPropositionDevis({
        demandeDevisId: demande.id,
        bureauEtudeId: myBureau.id,
        prix: Number.parseFloat(data.prix),
        dateRendu: data.dateRendu,
        dateIntervention: data.dateIntervention,
      });
      setMyProposition(newProp);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!demande) return <div>Demande introuvable.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link to="/be/dashboard" className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider">
        <ChevronLeft className="w-3 h-3 mr-1" />
        Retour aux missions
      </Link>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Colonne Principale */}
        <div className="flex-1 space-y-4">
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wider">
                  RÉF: #GC-{demande.id}
                </CardTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                  {demande.typeProjet || 'Projet Standard'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> Localisation
                  </h4>
                  <p className="text-xs font-semibold text-slate-700">
                    {demande.adresseProjet?.ville || 'Non renseigné'} 
                    <span className="text-slate-500 ml-1">({demande.adresseProjet?.codePostal})</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Échéance
                  </h4>
                  <p className="text-xs font-semibold text-slate-700">
                    {demande.delaiMax ? format(new Date(demande.delaiMax), 'dd MMM yyyy', {locale:fr}) : 'Flexible'}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description du besoin</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200 shadow-sm whitespace-pre-wrap">
                  {demande.description || 'Description non fournie par le client.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Latérale: Actions / Proposition */}
        <div className="w-full lg:w-80 space-y-4">
          {myProposition ? (
            <Card className="border-green-200 bg-green-50 shadow-sm h-full">
              <CardHeader className="pb-2 border-b border-green-100">
                <CardTitle className="flex items-center text-green-800 text-sm">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Offre Déposée
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-green-900 space-y-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-green-700 mb-1">Montant Estimé</span>
                  <span className="font-bold text-2xl font-mono">{myProposition.prix} € <span className="text-xs">HT</span></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-100/50 p-2 rounded">
                    <span className="block text-[10px] font-bold uppercase text-green-700 mb-1">Délai Rendu</span>
                    <span className="font-semibold text-xs">{myProposition.dateRendu ? format(new Date(myProposition.dateRendu), 'dd/MM/yyyy') : '-'}</span>
                  </div>
                  <div className="bg-green-100/50 p-2 rounded">
                    <span className="block text-[10px] font-bold uppercase text-green-700 mb-1">Statut</span>
                    <span className="font-semibold text-xs">
                      {myProposition.statut === 'REFUSEE' ? 'Refusée' : myProposition.statut === 'ACCEPTEE' ? 'Acceptée' : 'En attente'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 h-full flex flex-col">
              <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Formuler une offre</CardTitle>
                <CardDescription className="text-[10px]">Déposez votre estimation pour ce projet</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
                <CardContent className="pt-4 space-y-3 flex-1">
                  <Input
                    label="PRIX D'INTERVENTION (€ HT) *"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 4200"
                    {...register('prix', { required: true })}
                    error={errors.prix ? "Requis" : undefined}
                  />
                  <Input
                    label="ÉCHÉANCE DE RENDU *"
                    type="date"
                    {...register('dateRendu', { required: true })}
                    error={errors.dateRendu ? "Requis" : undefined}
                  />
                  <Input
                    label="DATE INTERVENTION (OPTIONNEL)"
                    type="date"
                    {...register('dateIntervention')}
                  />
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 py-3">
                  <Button type="submit" isLoading={isSubmitting} className="w-full text-[10px]">
                    SOUMETTRE MON OFFRE
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
