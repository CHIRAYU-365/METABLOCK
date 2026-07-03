import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
const Navbar = () => {
  const { user, logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <nav style={styles.nav} className="glass-panel">
      <div style={styles.logo}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="ProofChain Logo" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
          <h2 className="gradient-text">ProofChain</h2>
        </Link>
      </div>
      <div style={styles.links}>
        <Link to="/verify" style={styles.link}>Verify Document</Link>
        {user ? (
          <>
            <Link to="/" style={styles.link}>
              Dashboard 
              {user.role !== 'USER' && (
                <span style={styles.roleBadge}>{user.role.replace('_', ' ')}</span>
              )}
            </Link>
            <button className="btn-outline" onClick={handleLogout} style={{ marginLeft: '1rem', padding: '8px 16px' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
        {(user?.role === 'USER' || user?.role === 'ADMIN') && (
          <div style={{ marginLeft: '1rem' }}>
            <WalletMultiButton style={{ backgroundColor: 'var(--accent-primary)', borderRadius: '8px', height: '42px' }} />
          </div>
        )}
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
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  roleBadge: {
    fontSize: '0.65rem',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  }
};
export default Navbar;
