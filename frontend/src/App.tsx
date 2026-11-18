import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { WargaDashboardPage } from './pages/warga/WargaDashboardPage';
import { TimbanganPage } from './pages/admin/TimbanganPage';
import { KatalogPage } from './pages/common/KatalogPage';
import { RiwayatPage } from './pages/common/RiwayatPage';
import { DetailTransaksiPage } from './pages/common/DetailTransaksiPage';

const AdaptiveDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboardPage /> : <WargaDashboardPage />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      <div className="w-full max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative shadow-xl">
        {!isLoginPage && <Header />}
        <main className="flex-1">{children}</main>
        {!isLoginPage && <BottomNav />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes for All Authenticated Users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AdaptiveDashboard />} />
              <Route path="/katalog" element={<KatalogPage />} />
              <Route path="/riwayat" element={<RiwayatPage />} />
              <Route path="/transaksi/:id" element={<DetailTransaksiPage />} />
            </Route>

            {/* Protected Routes for Admin RW Only */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN_RW']} />}>
              <Route path="/timbangan" element={<TimbanganPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

