import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { select, wallet, publicKey, disconnect, connect } = useWallet();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isConnecting && wallet) {
      setIsConnecting(false);
      connect().catch((err) => {
        console.error("Wallet connect error:", err);
      });
    }
  }, [isConnecting, wallet, connect]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConnect = async () => {
    try {
      if (wallet) {
        await connect();
      } else if (window.solana && window.solana.isPhantom) {
        select('Phantom');
        setIsConnecting(true);
      } else {
        // Redirect to download if not installed
        window.open('https://phantom.app/', '_blank');
      }
    } catch (err) {
      console.error("Phantom connection error:", err);
    }
  };

  return (
    <nav style={styles.nav} className="glass-panel">
      <div style={styles.logo}>
        <Link to="/">
          <h2 className="gradient-text">ProofChain</h2>
        </Link>
      </div>
      <div style={styles.links}>
        <Link to="/verify" style={styles.link}>Verify Document</Link>
        {user ? (
          <>
            <Link to="/" style={styles.link}>Dashboard</Link>
            <button className="btn-outline" onClick={handleLogout} style={{ marginLeft: '1rem', padding: '8px 16px' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
        <div style={{ marginLeft: '1rem' }}>
          {publicKey ? (
            <button 
              className="btn-primary" 
              onClick={() => disconnect()}
              style={{ backgroundColor: 'var(--success)' }}
            >
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    margin: '1rem',
    borderRadius: '16px',
    borderBottom: 'none'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  link: {
    fontWeight: '500',
    color: 'var(--text-secondary)',
    transition: 'color 0.2s',
  }
};

export default Navbar;
