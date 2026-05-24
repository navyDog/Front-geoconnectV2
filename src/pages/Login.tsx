import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { loginCall } from '../api/auth';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const authRes = await loginCall({
        login: data.login,
        password: data.password
      });
      login(authRes);

      if (authRes.role === 'BUREAU_ETUDE') {
        navigate('/be/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Identifiants incorrects");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 relative">
      {/* Background gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 -z-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Bouton retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-lg">
                G
              </div>
            </div>
            <CardTitle className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Connexion
            </CardTitle>
            <CardDescription className="text-slate-600">
              Accédez à votre espace personnel
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5 pt-2">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium text-center">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                {...register('login', { required: true })}
                error={errors.login ? "Requis" : undefined}
              />

              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                {...register('password', { required: true })}
                error={errors.password ? "Requis" : undefined}
              />

              <div className="flex justify-end">
                <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
                isLoading={isLoading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500 font-medium">Pas encore de compte ?</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all font-bold"
                  onClick={() => navigate('/')}
                >
                  Demander un devis
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all text-sm font-medium"
                  onClick={() => navigate('/bureau-etudes/inscription')}
                >
                  Inscription Bureau d'Études
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
