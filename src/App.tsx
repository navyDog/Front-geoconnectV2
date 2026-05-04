/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Success from './pages/Success';

import ClientDashboard from './pages/client/Dashboard';
import ClientRequestDetail from './pages/client/RequestDetail';

import BEDashboard from './pages/be/Dashboard';
import BERequestDetail from './pages/be/RequestDetail';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/success" element={<Success />} />

            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/demande/:id" element={<ClientRequestDetail />} />
            </Route>

            {/* BE Routes */}
            <Route element={<ProtectedRoute allowedRoles={['BUREAU_ETUDE']} />}>
              <Route path="/be/dashboard" element={<BEDashboard />} />
              <Route path="/be/demande/:id" element={<BERequestDetail />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
