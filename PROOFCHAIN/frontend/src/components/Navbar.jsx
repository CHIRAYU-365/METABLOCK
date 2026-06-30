import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <WalletMultiButton style={{ backgroundColor: 'var(--accent-primary)', borderRadius: '8px' }} />
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
