import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { createDemandeDevis } from '../../api/demandeDevis';
import { getAllClients } from '../../api/client';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setErrorDetails('');
    try {
      if (!user) throw new Error("Vous n'êtes pas connecté.");

      const allClients = await getAllClients();
      const myClient = allClients.find(c => c.utilisateurId === user.userId);
      
      if (!myClient || !myClient.id) {
          throw new Error("Compte client introuvable pour cet utilisateur.");
      }

      await createDemandeDevis({
        clientId: myClient.id,
        delaiMax: data.delaiMax || undefined,
        typeProjet: data.typeProjet,
        description: data.description,
        adresseProjet: {
          rue: data.rueProjet || "Non renseigné",
          codePostal: data.codePostal,
          ville: data.ville,
        }
      });

      navigate('/client/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorDetails(err?.response?.data?.message || err?.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 text-center">
         <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Nouvelle demande géotechnique</h1>
         <p className="text-slate-500">Décrivez votre projet en quelques étapes simples.</p>
      </div>

      {errorDetails && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {errorDetails}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                Détails du projet
              </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Type de projet *</label>
                    <select 
                      className="w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 transition-colors"
                      {...formRegister('typeProjet', { required: true })}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Maison Individuelle">Maison Individuelle</option>
                      <option value="Extension">Extension</option>
                      <option value="Piscine">Piscine</option>
                      <option value="Immeuble Collectif">Immeuble Collectif</option>
                      <option value="Local Commercial">Local Commercial</option>
                    </select>
                    {errors.typeProjet && <span className="text-red-500 text-xs mt-1 block">Ce champ est requis</span>}
                  </div>
                  
                  <Input
                    label="Description ou particularités du projet"
                    placeholder="Brief description (ex: terrain très en pente...)"
                    {...formRegister('description')}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Rue"
                        placeholder="Ex : 15 Avenue des Champs-Élysées"
                        {...formRegister('rueProjet')}
                      />
                      <Input
                        label="Code Postal *"
                        placeholder="Ex : 75001"
                        {...formRegister('codePostal', { required: true })}
                        error={errors.codePostal ? "Requis" : undefined}
                      />
                      <Input
                        label="Ville *"
                        placeholder="Ex : Paris"
                        {...formRegister('ville', { required: true })}
                        error={errors.ville ? "Requis" : undefined}
                      />
                      <Input
                        type="date"
                        label="Date de remise souhaitée"
                        {...formRegister('delaiMax')}
                      />
                  </div>
              </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-3"
              onClick={() => navigate('/client/dashboard')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Créer la demande
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
