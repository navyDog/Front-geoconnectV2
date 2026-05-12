/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Success from './pages/Success';

import ClientDashboard from './pages/client/Dashboard';
import ClientRequestDetail from './pages/client/RequestDetail';
import ClientEtudeDetail from './pages/client/EtudeDetail';
import NewRequest from './pages/client/NewRequest';

import BEDashboard from './pages/be/Dashboard';
import BERequestDetail from './pages/be/RequestDetail';
import BEEtudeDetail from './pages/be/EtudeDetail';
import BERegister from './pages/be/BERegister';

// Redirige automatiquement selon le rôle si connecté, sinon affiche Home
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Home />;
  if (user?.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;
  if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/dashboard" replace />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/success" element={<Success />} />
            <Route path="/bureau-etudes/inscription" element={<BERegister />} />

            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/demande/new" element={<NewRequest />} />
              <Route path="/client/demande/:id" element={<ClientRequestDetail />} />
              <Route path="/client/etude/:id" element={<ClientEtudeDetail />} />
            </Route>

            {/* BE Routes */}
            <Route element={<ProtectedRoute allowedRoles={['BUREAU_ETUDE']} />}>
              <Route path="/be/dashboard" element={<BEDashboard />} />
              <Route path="/be/demande/:id" element={<BERequestDetail />} />
              <Route path="/be/etude/:id" element={<BEEtudeDetail />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
