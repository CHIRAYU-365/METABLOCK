import React, { useMemo, Suspense, lazy, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, useOutlet, Navigate } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { SOLANA_RPC_ENDPOINT } from './utils/solana';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Loader from './components/Loader';
import PageTransition from './components/PageTransition';

const Home = lazy(() => import('./pages/Home'));
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
  const wallet = useWallet();
  if (loading) return <Loader />;
  if (!user || !wallet.connected) return <Navigate to="/" replace />;
  return children;
};

const RoleDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get('tab') || (user?.role === 'SUPER_ADMIN' ? 'overview' : user?.role === 'ADMIN' ? 'issue' : 'mydocs');

  // Super Admin specific tabs
  if ((tab === 'overview' || tab === 'users' || tab === 'requests') && user?.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  // Admin specific tabs (Super Admin inherits these)
  if ((tab === 'issue' || tab === 'admin_stats') && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
    return <AdminDashboard />;
  }

  // Default / User tab (Everyone can see their own documents)
  return <Dashboard />; 
};

const AppLayout = () => {
  const location = useLocation();
  const element = useOutlet();

  return (
    <div className="app-container">
      {location.pathname !== '/' && <Navbar />}
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {element && React.cloneElement(element, { key: location.pathname })}
        </AnimatePresence>
      </main>
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { 
            background: '#0c0c10', 
            color: '#F0F0F5', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          } 
        }} 
      />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <PageTransition><Suspense fallback={<Loader />}><Home /></Suspense></PageTransition>
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <PageTransition><Suspense fallback={<Loader />}><RoleDashboard /></Suspense></PageTransition>
          </ProtectedRoute>
        )
      },
      {
        path: "login",
        element: <Navigate to="/" replace />
      },
      {
        path: "register",
        element: <Navigate to="/" replace />
      },
      {
        path: "verify",
        element: <PageTransition><Suspense fallback={<Loader />}><Verify /></Suspense></PageTransition>
      }
    ]
  }
]);

function App() {
  // Enforce ZTNA: Clear previous wallet adapter states to ensure manual reconnection is always required
  useEffect(() => {
    localStorage.removeItem('walletName');
    
    // Explicitly disconnect if closing window
    const handleUnload = () => {
      localStorage.removeItem('walletName');
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
