import React, { useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SOLANA_RPC_ENDPOINT } from './utils/solana';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';

import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter()
    ],
    []
  );

  useEffect(() => {
    // Clear storage on project startup/load to connect wallet & login afresh
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('walletName');
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <AuthProvider>
            <BrowserRouter>
              <div className="app-container">
                <Navbar />
                <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify" element={<Verify />} />
                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
