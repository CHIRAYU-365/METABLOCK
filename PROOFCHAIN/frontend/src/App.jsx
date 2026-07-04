import React, { useMemo, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SOLANA_RPC_ENDPOINT } from './utils/solana';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Loader from './components/Loader';
import PageTransition from './components/PageTransition';


const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Verify = lazy(() => import('./pages/Verify'));
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  return children;
};
const RoleDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  return <Dashboard />; 
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <PageTransition><Suspense fallback={<Loader />}><Login /></Suspense></PageTransition>
        } />
        <Route path="/register" element={
          <PageTransition><Suspense fallback={<Loader />}><Register /></Suspense></PageTransition>
        } />
        <Route path="/verify" element={
          <PageTransition><Suspense fallback={<Loader />}><Verify /></Suspense></PageTransition>
        } />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <PageTransition><Suspense fallback={<Loader />}><RoleDashboard /></Suspense></PageTransition>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};
function App() {
  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter()
    ],
    []
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <AuthProvider>
            <BrowserRouter>
              <div className="app-container">
                <Navbar />
                <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                  <AnimatedRoutes />
                </main>
                <Toaster position="bottom-right" toastOptions={{ style: { background: '#121216', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' } }} />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
export default App;
