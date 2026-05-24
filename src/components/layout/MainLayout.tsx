import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { getClientByUserId } from '../../api/client';
import { getBureauByUserId } from '../../api/bureauEtude';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from '../ui/NotificationBell';
import { ParametresButton } from '../ui/ParametresButton';

export default function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identityLabel, setIdentityLabel] = useState<string>('');

  const notifications = useNotifications(isAuthenticated);

  useEffect(() => {
    async function loadIdentityLabel() {
      if (!isAuthenticated || !user?.userId) {
        setIdentityLabel('');
        return;
      }

      try {
        if (user.role === 'CLIENT') {
          const myClient = await getClientByUserId(user.userId);
          const fullName = [myClient?.prenom, myClient?.nom].filter(Boolean).join(' ').trim();
          setIdentityLabel(fullName || 'Client');
          return;
        }

        if (user.role === 'BUREAU_ETUDE') {
          const myBureau = await getBureauByUserId(user.userId);
          setIdentityLabel(myBureau?.raisonSociale || 'Bureau d\'Études');
          return;
        }

        setIdentityLabel(user.login || 'Utilisateur');
      } catch {
        setIdentityLabel(user.role === 'BUREAU_ETUDE' ? 'Bureau d\'Études' : 'Client');
      }
    }

    loadIdentityLabel();
  }, [isAuthenticated, user]);

  const roleLabel = useMemo(() => {
    if (user?.role === 'BUREAU_ETUDE') return 'Bureau d\'Études';
    if (user?.role === 'CLIENT') return 'Client';
    return 'Utilisateur';
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'CLIENT'
    ? [{ label: 'Mes demandes', path: '/client/dashboard' }]
    : user?.role === 'BUREAU_ETUDE'
    ? [{ label: 'Marketplace', path: '/be/dashboard' }]
    : [];

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans flex flex-col">
      <nav className="sticky top-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md group-hover:scale-105 transition-transform">
              G
            </div>
            <span className="font-black tracking-tight text-lg bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
              MON ÉTUDE DE SOL
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`py-5 transition-all ${
                      isActive
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'hover:text-emerald-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none text-slate-900">{identityLabel || roleLabel}</p>
                <p className="text-[10px] text-slate-500">{user?.login} • {roleLabel}</p>
              </div>
              {user?.role === 'BUREAU_ETUDE' && (
                <ParametresButton to="/be/parametres" />
              )}
              <NotificationBell
                unreadCount={notifications.unreadCount}
                notifications={notifications.notifications}
                isLoadingList={notifications.isLoadingList}
                listError={notifications.listError}
                loadNotifications={notifications.loadNotifications}
                markAsRead={notifications.markAsRead}
                markAllAsRead={notifications.markAllAsRead}
              />
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Connexion
              </Link>
              <Link
                to="/"
                className="text-sm font-bold px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Obtenir un devis
              </Link>
              <Link
                to="/bureau-etudes/inscription"
                className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors border-l border-slate-200 pl-3 hidden sm:block"
              >
                Vous êtes un BE ?
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
        <Outlet />
      </main>

      <footer className="h-6 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 flex-shrink-0 z-10 w-full fixed bottom-0 md:relative">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Serveur Opérationnel</span>
        </div>
        <div className="font-medium">v1.0.0 • © 2026 Mon Étude de Sol SAS</div>
      </footer>
    </div>
  );
}
