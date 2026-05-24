import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerCall } from '../../api/auth';
import { createBureauEtude } from '../../api/bureauEtude';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, FileText, Upload, ArrowLeft, CheckCircle2, MapPin, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function BERegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setErrorDetails('');
    try {
      // 1. Register User (Role: BUREAU_ETUDE)
      const authRes = await registerCall({
        login: data.email,
        password: data.password,
        role: 'BUREAU_ETUDE'
      });

      // Persist the token via AuthContext (gère localStorage + état global)
      if (authRes.token) {
        login(authRes);
      }

      // 2. Create Bureau d'Etude Profile
      await createBureauEtude({
        raisonSociale: data.raisonSociale,
        emailContact: data.email,
        telContact: data.telContact,
        utilisateurId: authRes.userId,
        adresse: {
          rue: data.rue || "Non renseigné",
          codePostal: data.codePostal,
          ville: data.ville,
        }
      });
      
      // Usually, it requires admin validation, so let's show a success message
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorDetails(err?.response?.data?.message || err?.message || 'Une erreur est survenue lors de l\'inscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 relative">
        {/* Background gradient animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 -z-10">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-40 -right-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          </div>
        </div>

        <Card className="max-w-lg mx-auto bg-white/80 backdrop-blur-sm border-emerald-200 shadow-2xl text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center rounded-2xl mb-6 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent mb-3">
              Demande enregistrée !
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700 text-lg font-medium leading-relaxed">
              Votre compte professionnel a bien été créé.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left">
              <p className="text-sm text-slate-700 leading-relaxed">
                Notre équipe va valider vos informations et vos documents.
                Vous recevrez un <span className="font-bold text-emerald-700">email de confirmation</span> dès que votre compte sera activé.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 relative">
      {/* Background gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 -z-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Bouton retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-1 bg-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase mb-4">
            Inscription professionnelle
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
            Rejoignez notre réseau
          </h1>
          <p className="text-lg text-slate-600">Inscrivez votre Bureau d'Étude Géotechnique</p>
        </div>

        {errorDetails && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium">
            {errorDetails}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Informations entreprise */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-xl font-black flex items-center text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <Input
                label="Raison Sociale *"
                placeholder="Ex: GeoExpert SAS"
                {...register('raisonSociale', { required: true })}
                error={errors.raisonSociale ? "Requis" : undefined}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email professionnel *"
                  type="email"
                  placeholder="contact@entreprise.fr"
                  {...register('email', { required: true })}
                  error={errors.email ? "Requis" : undefined}
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="01 23 45 67 89"
                  {...register('telContact')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Sécurité */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-sky-50 to-violet-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-xl font-black flex items-center text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                Sécurité du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Mot de passe *"
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: true })}
                  error={errors.password ? "Requis" : undefined}
                />
                <Input
                  label="Confirmation *"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: true,
                    validate: (val: string, values: any) => val === values.password || "Les mots de passe ne correspondent pas"
                  })}
                  error={errors.confirmPassword ? (errors.confirmPassword.message as string) : undefined}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Adresse */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-emerald-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-xl font-black flex items-center text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                Adresse de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <Input
                label="Rue"
                placeholder="10 rue de la Géologie"
                {...register('rue')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  placeholder="75001"
                  {...register('codePostal', { required: true })}
                  error={errors.codePostal ? "Requis" : undefined}
                />
                <Input
                  label="Ville *"
                  placeholder="Paris"
                  {...register('ville', { required: true })}
                  error={errors.ville ? "Requis" : undefined}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Documents */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-xl font-black flex items-center text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Documents justificatifs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-emerald-300 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-slate-100 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <p className="text-sm text-slate-700 font-bold mb-1">Glissez-déposez vos fichiers ici</p>
                <p className="text-xs text-slate-500">Kbis, Assurances • PDF, JPG jusqu'à 10MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Bouton submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all"
            isLoading={isSubmitting}
          >
            Soumettre ma candidature
          </Button>
        </form>
      </div>
    </div>
  );
}
