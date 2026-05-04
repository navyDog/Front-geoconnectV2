import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { registerCall } from '../api/auth';
import { createClient } from '../api/client';
import { createDemandeDevis } from '../api/demandeDevis';
import { MapPin, Briefcase, Mail } from 'lucide-react';

export default function Home() {
  const [step, setStep] = useState(0);
  
  if (step === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-12 max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-4xl italic mb-2">
          G
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
          CONNECTEZ-VOUS AUX EXPERTS GEOTECHNIQUES
        </h1>
        <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
          Un portail simple et sécurisé pour débloquer l'accès à un réseau qualifié de bureaux d'études.
        </p>
        <Button size="lg" onClick={() => setStep(1)} className="mt-4">
          DÉMARRER LE TUNNEL
        </Button>
      </div>
    );
  }

  return <QuoteTunnel />;
}

function QuoteTunnel() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data });
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitTunnel({ ...formData, ...data });
    }
  };

  const submitTunnel = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Register User
      const authRes = await registerCall({
        email: data.email,
        password: data.password,
        role: 'CLIENT'
      });
      
      // Keep user in context
      login(authRes);

      // 2. Create Client Profile
      const client = await createClient({
        nom: data.nom,
        prenom: data.prenom,
        utilisateurId: authRes.userId,
        adresseFacturation: {
          ville: data.ville,
          codePostal: data.codePostal // Simple mapping for MVP
        }
      });

      // 3. Create DemandeDevis
      await createDemandeDevis({
        clientId: client.id,
        delaiMax: data.delaiMax || undefined,
        typeProjet: data.typeProjet,
        description: data.description,
        adresseProjet: {
          codePostal: data.codePostal,
          ville: data.ville,
        }
      });

      navigate('/success');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                s <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`h-1 w-16 sm:w-32 mx-2 rounded ${
                  s < step ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {step === 1 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center"><Briefcase className="w-5 h-5 mr-2 text-blue-600"/> Quel est votre besoin ?</CardTitle>
              <CardDescription>Qualifions rapidement votre projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Type de projet *</label>
                <select
                  {...formRegister('typeProjet', { required: true })}
                  className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="GEOTECHNIQUE">Étude de sol (Géotechnique)</option>
                  <option value="ENVIRONNEMENT">Étude environnementale</option>
                  <option value="STRUCTURE">Étude de structure</option>
                </select>
                {errors.typeProjet && <span className="text-red-500 text-xs">Requis</span>}
              </div>
              <Input
                label="Code Postal du projet *"
                placeholder="Ex : 75001"
                {...formRegister('codePostal', { required: true })}
                error={errors.codePostal ? "Requis" : undefined}
              />
              <Input
                label="Ville du projet *"
                {...formRegister('ville', { required: true })}
                error={errors.ville ? "Requin" : undefined}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Suivant</Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600"/> Détails du projet</CardTitle>
              <CardDescription>Donnez plus de contexte à votre demande.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Description du projet *</label>
                <textarea
                  {...formRegister('description', { required: true })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Décrivez votre besoin..."
                />
                {errors.description && <span className="text-red-500 text-xs">Requis</span>}
              </div>
              <Input
                type="date"
                label="Délai maximum souhaité (facultatif)"
                {...formRegister('delaiMax')}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Retour</Button>
              <Button type="submit">Suivant</Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center"><Mail className="w-5 h-5 mr-2 text-blue-600"/> Vos coordonnées</CardTitle>
              <CardDescription>Créez votre compte pour recevoir vos devis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  {...formRegister('prenom', { required: true })}
                  error={errors.prenom ? "Requis" : undefined}
                />
                <Input
                  label="Nom *"
                  {...formRegister('nom', { required: true })}
                  error={errors.nom ? "Requis" : undefined}
                />
              </div>
              <Input
                type="email"
                label="Email *"
                placeholder="votre@email.com"
                {...formRegister('email', { required: true })}
                error={errors.email ? "Requis" : undefined}
              />
              <Input
                type="password"
                label="Mot de passe *"
                {...formRegister('password', { required: true, minLength: 6 })}
                error={errors.password ? "Minimum 6 caractères" : undefined}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Retour</Button>
              <Button type="submit" isLoading={isLoading}>Publier ma demande</Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
