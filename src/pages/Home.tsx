import React, { useRef, useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { registerCall } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { createClient, getClientByUserId } from '../api/client';
import { createDemandeDevis } from '../api/demandeDevis';
import { uploadDocument } from '../api/document';
import { useTypesEtude } from '../hooks/useTypesEtude';
import { MapPin, Briefcase, Mail, Paperclip, CheckCircle, Clock, Shield, Users } from 'lucide-react';
import { TypeDemandeDevis } from '../types';

export default function Home() {
  const [step, setStep] = useState(0);
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;
    if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/dashboard" replace />;
  }

  if (step === 0) {
    return (
      <div className="w-full -mx-4 sm:-mx-6 -mt-6">
        {/* Hero Section - Design Glassmorphism moderne */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {/* Background avec gradient animé */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50">
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
              <div className="absolute top-40 -right-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>
          </div>

          <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-emerald-200 mb-8 shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-slate-700">Plateforme 100% gratuite pour les clients</span>
              </div>

              {/* Titre principal */}
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 tracking-tight">
                <span className="bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
                  Votre étude de sol
                </span>
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                    en 48h chrono
                  </span>
                  <div className="absolute -bottom-2 left-0 w-full h-4 bg-emerald-200 opacity-40 blur-sm"></div>
                </span>
              </h1>

              {/* Sous-titre */}
              <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
                Connectez-vous aux meilleurs bureaux d'études géotechniques.<br />
                <span className="font-medium text-emerald-700">Simple. Rapide. Transparent.</span>
              </p>

              {/* CTA principal */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setStep(1)}
                  className="group relative px-8 py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10">Obtenir mes devis →</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Gratuit & sans engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Bureaux certifiés</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Réponse sous 48h</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Cards glassmorphism */}
        <section className="py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Comment ça marche</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-3">
                3 étapes seulement
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-2xl">
                  1
                </div>
                <div className="mt-8 mb-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Décrivez votre besoin</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Un formulaire intelligent de 3 minutes pour qualifier précisément votre projet géotechnique.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-2xl">
                  2
                </div>
                <div className="mt-8 mb-6">
                  <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-sky-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Recevez les offres</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Les meilleurs bureaux d'études de votre région vous proposent leurs devis sous 48h.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-2xl">
                  3
                </div>
                <div className="mt-8 mb-6">
                  <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-7 h-7 text-violet-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Choisissez & validez</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Comparez en toute transparence et lancez votre étude avec le partenaire idéal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Split Section - Avantages + BE */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Colonne gauche - Avantages */}
              <div>
                <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Pourquoi nous</span>
                <h2 className="text-4xl font-black text-slate-900 mt-3 mb-8">
                  Une plateforme pensée pour vous
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Gain de temps radical</h4>
                      <p className="text-slate-600">
                        Fini les recherches. Accédez en 3 clics à un réseau d'experts qualifiés et disponibles.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-md">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Qualité garantie</h4>
                      <p className="text-slate-600">
                        Tous nos bureaux d'études sont vérifiés, certifiés et évalués par nos clients.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Transparence totale</h4>
                      <p className="text-slate-600">
                        Comparez les offres simplement : prix, délais, méthodologie. Tout est clair.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite - Card BE */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-sky-600 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 shadow-2xl">
                  <div className="inline-block px-4 py-1 bg-emerald-500 rounded-full text-white text-xs font-bold uppercase mb-6">
                    Bureaux d'études
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">
                    Développez votre activité
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-8">
                    Rejoignez notre réseau et accédez à des projets qualifiés dans votre région.
                    Augmentez votre visibilité et votre chiffre d'affaires.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Leads qualifiés en continu</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Commission uniquement si succès</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Outils de gestion intégrés</span>
                    </li>
                  </ul>
                  <Link to="/bureau-etudes/inscription">
                    <button className="w-full px-6 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg">
                      Rejoindre le réseau →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final - Design impactant */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-emerald-50 to-sky-50">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-400 rounded-full blur-3xl"></div>
          </div>
          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              Prêt à démarrer<br />votre projet ?
            </h2>
            <p className="text-xl text-slate-600 mb-10">
              Vos premiers devis professionnels en moins de 48 heures
            </p>
            <button
              onClick={() => setStep(1)}
              className="inline-block px-10 py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xl font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
            >
              C'est parti ! →
            </button>
          </div>
        </section>
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
  const [docFile, setDocFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
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
        login: data.login,
        password: data.password,
        role: 'CLIENT',
      });

      login(authRes);

      // 2. Create Client Profile
      let client = await createClient({
        civilite: data.civilite || undefined,
        nom: data.nom,
        prenom: data.prenom,
        emailContact: data.login,
        telContact: data.telContact || undefined,
        utilisateurId: authRes.userId,
        adresseFacturation: {
          rue: data.rue || 'Non renseigné',
          ville: data.ville,
          codePostal: data.codePostal,
        },
      });

      let clientId = client?.id;

      if (!clientId) {
        const myClient = await getClientByUserId(authRes.userId);
        if (myClient?.id) {
          clientId = myClient.id;
        } else {
          throw new Error('Client créé mais introuvable sur le serveur.');
        }
      }

      // 3. Create DemandeDevis (avec document optionnel)
      let docsDevisId: number | undefined;
      if (docFile) {
        const uploaded = await uploadDocument(docFile);
        docsDevisId = uploaded.id;
      }

      await createDemandeDevis({
        clientId,
        delaiMaxSouhaite: data.delaiMaxSouhaite ? Number(data.delaiMaxSouhaite) : undefined,
        type: data.type as TypeDemandeDevis,
        description: data.description,
        nombreLot: data.nombreLot ? Number(data.nombreLot) : undefined,
        referenceCadastrale: data.referenceCadastrale || undefined,
        superficie: data.superficie ? Number(data.superficie) : undefined,
        docsDevisId,
        adresseProjet: {
          rue: data.rueProjet || 'Non renseigné',
          codePostal: data.codePostalProjet || data.codePostal,
          ville: data.villeProjet || data.ville,
        },
      });

      navigate('/success');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 relative">
      {/* Background gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 -z-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors mb-8"
        >
          <MapPin className="w-4 h-4" />
          Retour à l'accueil
        </button>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md transition-all ${
                    s <= step
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-110'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-2 w-12 sm:w-24 mx-2 rounded-full transition-all ${
                      s < step ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm font-bold text-slate-600">
              Étape {step} sur 3
            </p>
          </div>
        </div>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        {step === 1 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  Quel est votre besoin ?
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 ml-15">
                Qualifions rapidement votre projet géotechnique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Type de mission */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Type de mission *</label>
                <select
                  {...formRegister('type', { required: true })}
                  disabled={loadingTypes}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 font-medium"
                >
                  <option value="">{loadingTypes ? 'Chargement…' : 'Sélectionnez un type'}</option>
                  {typesEtude.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
                {errors.type && <span className="text-red-600 text-xs font-medium">Requis</span>}
              </div>

              {/* Adresse du projet */}
              <Input
                label="Rue du projet"
                placeholder="Ex : 15 Avenue des Champs-Élysées"
                {...formRegister('rueProjet')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  placeholder="Ex : 75001"
                  {...formRegister('codePostalProjet', { required: true })}
                  error={errors.codePostalProjet ? 'Requis' : undefined}
                />
                <Input
                  label="Ville *"
                  {...formRegister('villeProjet', { required: true })}
                  error={errors.villeProjet ? 'Requis' : undefined}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-200">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg"
              >
                Continuer →
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader className="bg-gradient-to-r from-sky-50 to-violet-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-md">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  Détails du projet
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 ml-15">
                Donnez plus de contexte à votre demande.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Description du projet *</label>
                <textarea
                  {...formRegister('description', { required: true })}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-h-[120px] font-medium"
                  placeholder="Décrivez votre besoin, contraintes particulières..."
                />
                {errors.description && <span className="text-red-600 text-xs font-medium">Requis</span>}
              </div>
              <Input
                label="Référence cadastrale"
                placeholder="Ex : AB 0042"
                {...formRegister('referenceCadastrale')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Superficie (m²)"
                  type="number"
                  placeholder="Ex : 500"
                  {...formRegister('superficie')}
                />
                <Input
                  label="Nombre de lots"
                  type="number"
                  placeholder="Ex : 1"
                  {...formRegister('nombreLot')}
                />
              </div>
              <Input
                type="number"
                label="Délai maximum souhaité (semaines, facultatif)"
                placeholder="Ex : 8"
                min={1}
                {...formRegister('delaiMaxSouhaite')}
              />

              {/* Document joint */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  Document joint (plans, cahier des charges…)
                </label>
                <div
                  className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-xl px-4 py-4 cursor-pointer hover:bg-sky-50 hover:border-sky-300 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-sky-600 shrink-0 transition-colors" />
                  <span className="text-sm text-slate-600 group-hover:text-sky-700 truncate font-medium">
                    {docFile ? docFile.name : 'Joindre un fichier (PDF, image…)'}
                  </span>
                  {docFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDocFile(null); }}
                      className="ml-auto text-slate-400 hover:text-red-500 text-sm font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-slate-300 hover:border-slate-400 font-bold"
              >
                ← Retour
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold py-3 rounded-xl shadow-lg"
              >
                Continuer →
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader className="bg-gradient-to-r from-violet-50 to-emerald-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  Vos coordonnées
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 ml-15">
                Créez votre compte pour recevoir vos devis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl font-medium">{error}</div>
              )}
              {/* Civilité */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Civilité</label>
                <select
                  {...formRegister('civilite')}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-medium"
                >
                  <option value="">—</option>
                  <option value="MR">M.</option>
                  <option value="MME">Mme</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  {...formRegister('prenom', { required: true })}
                  error={errors.prenom ? 'Requis' : undefined}
                />
                <Input
                  label="Nom *"
                  {...formRegister('nom', { required: true })}
                  error={errors.nom ? 'Requis' : undefined}
                />
              </div>
              <Input
                label="Téléphone"
                type="tel"
                placeholder="06 00 00 00 00"
                {...formRegister('telContact')}
              />
              <Input
                label="Rue (adresse de facturation) *"
                placeholder="12 rue de la République"
                {...formRegister('rue', { required: true })}
                error={errors.rue ? 'Requis' : undefined}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  {...formRegister('codePostal', { required: true })}
                  error={errors.codePostal ? 'Requis' : undefined}
                />
                <Input
                  label="Ville *"
                  {...formRegister('ville', { required: true })}
                  error={errors.ville ? 'Requis' : undefined}
                />
              </div>
              <Input
                type="email"
                label="Email (identifiant de connexion) *"
                placeholder="votre@email.com"
                {...formRegister('login', { required: true })}
                error={errors.login ? 'Requis' : undefined}
              />
              <Input
                type="password"
                label="Mot de passe *"
                {...formRegister('password', { required: true, minLength: 6 })}
                error={errors.password ? 'Minimum 6 caractères' : undefined}
              />
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-2 border-slate-300 hover:border-slate-400 font-bold"
              >
                ← Retour
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="flex-1 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white font-black text-lg py-3 rounded-xl shadow-xl"
              >
                Publier ma demande 🚀
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
      </div>
    </div>
  );
}
