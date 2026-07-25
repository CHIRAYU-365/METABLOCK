import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={{
        ...styles.nav,
        ...(scrolled ? styles.navScrolled : {}),
      }}>
        <div style={styles.inner}>
          {}
          <Link to="/" style={styles.logoLink}>
            <div style={styles.logoIcon}>
              <span style={styles.logoGlyph}>P</span>
            </div>
            <span style={styles.logoText}>ProofChain</span>
          </Link>

          {}
          <div style={styles.desktopNav}>
            {(!user || user.role !== 'SUPER_ADMIN') && (
              <Link 
                to="/verify" 
                style={{ ...styles.navLink, ...(isActive('/verify') ? styles.navLinkActive : {}) }}
              >
                Verify
              </Link>
            )}

            {!user && (
              <Link 
                to="/login" 
                style={{ ...styles.navLink, ...(isActive('/login') ? styles.navLinkActive : {}) }}
              >
                Login / Signup
              </Link>
            )}
            {user && (
              <>
                <Link 
                  to={user.role === 'SUPER_ADMIN' ? "/dashboard?tab=overview" : user.role === 'ADMIN' ? "/dashboard?tab=issue" : "/dashboard?tab=mydocs"} 
                  style={{ ...styles.navLink, ...(isActive('/dashboard') && (!location.search || location.search.includes('tab=overview') || location.search.includes('tab=issue') || location.search.includes('tab=mydocs')) ? styles.navLinkActive : {}) }}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                  {user.role !== 'USER' && (
                    <span style={styles.roleBadge}>{user.role.replace('_', ' ')}</span>
                  )}
                </Link>
                {user.role === 'ADMIN' && (
                  <Link 
                    to="/dashboard?tab=admin_stats" 
                    style={{ ...styles.navLink, ...(location.search.includes('tab=admin_stats') ? styles.navLinkActive : {}) }}
                  >
                    Issued Documents
                  </Link>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <Link 
                      to="/dashboard?tab=users" 
                      style={{ ...styles.navLink, ...(location.search.includes('tab=users') ? styles.navLinkActive : {}) }}
                    >
                      Platform Users
                    </Link>
                    <Link 
                      to="/dashboard?tab=requests" 
                      style={{ ...styles.navLink, ...(location.search.includes('tab=requests') ? styles.navLinkActive : {}) }}
                    >
                      Multi-Sig Requests
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {}
          <div style={styles.rightGroup}>
            <div style={styles.walletWrapper}>
              <WalletMultiButton />
            </div>
            {user && (
              <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                <LogOut size={16} />
              </button>
            )}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              style={styles.hamburger}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {}
        <div style={{
          ...styles.glowLine,
          opacity: scrolled ? 1 : 0
        }} />
      </nav>

      {}
      {mobileOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileMenuInner}>
            {(!user || user.role !== 'SUPER_ADMIN') && (
              <Link to="/verify" style={styles.mobileLink}>Verify Document</Link>
            )}
            {user && (
              <>
                <Link 
                  to={user.role === 'SUPER_ADMIN' ? "/dashboard?tab=overview" : user.role === 'ADMIN' ? "/dashboard?tab=issue" : "/dashboard?tab=mydocs"} 
                  style={styles.mobileLink}
                >
                  Dashboard
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/dashboard?tab=admin_stats" style={styles.mobileLink}>
                    Issued Documents
                  </Link>
                )}
              </>
            )}
            {user && (
              <button onClick={handleLogout} style={{ ...styles.mobileLink, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {}
      <div style={{ height: '72px' }} />
    </>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'rgba(3, 3, 4, 0.6)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    borderBottom: '1px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  navScrolled: {
    background: 'rgba(6, 6, 8, 0.85)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
  },
  inner: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
    height: '72px'
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(139, 92, 246, 0.15))',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
  },
  logoGlyph: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 800,
    fontSize: '1.1rem',
    background: 'linear-gradient(135deg, #00F0FF, #8B5CF6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  logoText: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    fontSize: '1.2rem',
    color: '#F0F0F5',
    letterSpacing: '-0.02em'
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
    textDecoration: 'none'
  },
  navLinkActive: {
    color: 'var(--neon-cyan)',
    background: 'rgba(0, 240, 255, 0.06)'
  },
  roleBadge: {
    fontSize: '0.6rem',
    background: 'rgba(139, 92, 246, 0.15)',
    color: '#8B5CF6',
    padding: '2px 6px',
    borderRadius: '6px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    border: '1px solid rgba(139, 92, 246, 0.2)'
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  walletWrapper: {
    
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  hamburger: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  glowLine: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.3), rgba(139, 92, 246, 0.3), transparent)',
    transition: 'opacity 0.3s ease'
  },
  mobileMenu: {
    position: 'fixed',
    top: '72px',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    background: 'rgba(3, 3, 4, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    animation: 'fadeIn 0.2s ease'
  },
  mobileMenuInner: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    gap: '0.5rem'
  },
  mobileLink: {
    display: 'block',
    padding: '16px 20px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontFamily: 'Outfit, sans-serif',
    transition: 'background 0.2s'
  }
};


const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    nav [style] .desktop-nav { display: none !important; }
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#navbar-responsive')) {
  styleSheet.id = 'navbar-responsive';
  document.head.appendChild(styleSheet);
}

export default Navbar;
