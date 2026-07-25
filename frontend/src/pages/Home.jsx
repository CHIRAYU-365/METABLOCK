import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Zap, Lock, FileCheck, ArrowRight, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import toast from 'react-hot-toast';

const Home = () => {
  const [counters, setCounters] = useState({ docs: 0, txns: 0, uptime: 0 });
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const { login, register, user, logout, linkWallet } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGetStarted = () => {
    logout();
    if (wallet.connected) {
      wallet.disconnect();
    }
    setEmail('');
    setPassword('');
    setUsername('');
    setShowAuthModal(true);
  };

  useEffect(() => {
    if (location.pathname === '/login') {
      handleGetStarted();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user && wallet.connected && showAuthModal) {
      const verifyWallet = async () => {
        try {
          await linkWallet(wallet.publicKey.toString());
          toast.success("Zero-Trust Dual Verification Complete");
          setShowAuthModal(false);
          navigate('/dashboard');
        } catch (err) {
          toast.error(err.response?.data?.error || "Wallet mismatch! Connected wallet does not match registered account.");
          wallet.disconnect(); 
        }
      };
      verifyWallet();
    }
  }, [user, wallet.connected, showAuthModal, navigate, wallet.publicKey]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await register(username, email, password);
        toast.success("Web2 Identity Registered! Proceed to Web3 Wallet Verification.");
      } else {
        await login(email, password);
        toast.success("Web2 Identity Verified! Proceed to Web3 Wallet Verification.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach(s => observer.observe(s));
    return () => sections.forEach(s => observer.unobserve(s));
  }, []);

  return (
    <div style={{ overflow: 'hidden', height: showAuthModal ? '100vh' : 'auto' }}>
      {}
      {showAuthModal && (
        <div style={styles.modalOverlay}>
          <div className="card-glow animate-scale-in" style={styles.modalContent}>
            <button style={styles.closeBtn} onClick={() => setShowAuthModal(false)}><X size={24} /></button>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={styles.logoIcon}><img src="/logo.png" alt="ProofChain Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
              <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Secure Portal Access</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Strict Zero-Trust Network Access (ZTNA) Policy Enforced</p>
            </div>
            
            <div style={styles.stepContainer}>
              {!user ? (
                                <div style={{ ...styles.authStep, opacity: 1 }} className="animate-fade-in">
                  <div style={styles.stepHeader}>
                    <div style={{ ...styles.authStepNumber, background: 'var(--neon-cyan)' }}>1</div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Identity Verification (Web2)</h4>
                  </div>
                  <form onSubmit={handleAuthSubmit}>
                    {isRegistering && (
                      <input 
                        type="text" 
                        placeholder="Username" 
                        required 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        style={styles.modalInput} 
                      />
                    )}
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      style={styles.modalInput} 
                    />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      style={styles.modalInput} 
                    />
                    <button type="submit" className="btn-primary" disabled={authLoading} style={{ width: '100%' }}>
                      {authLoading ? 'Verifying...' : isRegistering ? 'Sign Up' : 'Login'}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {isRegistering ? "Already have an account? " : "Don't have an account? "}
                      <span style={{ color: 'var(--neon-cyan)', cursor: 'pointer' }} onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? "Login" : "Sign Up"}
                      </span>
                    </p>
                  </form>
                </div>
              ) : (
                                <div style={{ ...styles.authStep, opacity: 1 }} className="animate-fade-in">
                  <div style={styles.stepHeader}>
                    <div style={{ ...styles.authStepNumber, background: wallet.connected ? 'var(--neon-green)' : 'var(--neon-violet)' }}>2</div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Cryptographic Verification (Web3)</h4>
                  </div>
                  {!wallet.connected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                      <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(0, 255, 170, 0.1)', border: '1px solid var(--neon-green)', borderRadius: '8px', color: 'var(--neon-green)', textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
                        ✓ Web2 Identity Verified ({user.email})
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Connect your Solana wallet to complete authorization.</p>
                      <WalletMultiButton style={{ background: 'var(--neon-violet)' }} />
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', background: 'rgba(0, 255, 170, 0.1)', border: '1px solid var(--neon-green)', borderRadius: '8px', color: 'var(--neon-green)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <Shield size={32} />
                      <strong>✓ Fully Authorized</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(0, 255, 170, 0.8)' }}>Redirecting to Secure Portal...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ filter: showAuthModal ? 'blur(10px) brightness(0.4)' : 'none', transition: 'all 0.3s ease' }}>
      {}
      <section ref={heroRef} style={styles.hero}>
        {}
        <div style={styles.gridBg} />
        
        {}
        <div style={{ ...styles.orb, ...styles.orb1 }} />
        <div style={{ ...styles.orb, ...styles.orb2 }} />
        <div style={{ ...styles.orb, ...styles.orb3 }} />

        <div style={styles.heroContent} className="animate-fade-in">
          <div style={styles.heroBadge} className="animate-fade-in-delay-1">
            <span style={styles.pulseDot} />
            <span>Powered by Solana Blockchain</span>
          </div>

          <h1 style={styles.heroTitle}>
            Immutable Document<br />
            <span className="gradient-text">Verification</span>
          </h1>

          <p style={styles.heroSubtitle} className="animate-fade-in-delay-2">
            Cryptographically secure document notarization on Solana. 
            Zero-knowledge proofs ensure privacy while maintaining 
            verifiable authenticity on an immutable ledger.
          </p>

          <div style={styles.heroCtas} className="animate-fade-in-delay-3">
            <button onClick={handleGetStarted} className="btn-primary" style={{ ...styles.ctaBtn, padding: '16px 40px', fontSize: '1.2rem' }}>
              Get Started
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {}
        <div style={styles.scrollIndicator} className="animate-fade-in-delay-3">
          <ChevronDown size={20} style={{ animation: 'float 2s ease-in-out infinite' }} />
        </div>
      </section>


      {}
      <section ref={featuresRef} style={styles.featuresSection}>
        <div className="reveal-section" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            Why <span className="gradient-text">ProofChain</span>?
          </h2>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            Enterprise-grade document verification built on decentralized infrastructure.
            Every document gets a unique cryptographic fingerprint stored forever on-chain.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card-glow reveal-section"
              style={{ ...styles.featureCard, animationDelay: `${i * 0.1}s` }}
            >
              <div style={{ ...styles.featureIcon, background: f.iconBg }}>
                {f.icon}
              </div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section style={styles.howSection}>
        <div className="reveal-section" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
        </div>

        <div style={styles.stepsGrid}>
          {steps.map((step, i) => (
            <div key={i} className="reveal-section" style={styles.stepItem}>
              <div style={styles.stepNumber}>
                <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>{step.title}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {step.desc}
              </p>
              {i < steps.length - 1 && (
                <div style={styles.stepConnector} />
              )}
            </div>
          ))}
        </div>
      </section>

      {}
      <section style={styles.ctaSection}>
        <div className="card-glow reveal-section" style={styles.ctaBanner}>
          <h2 style={{ marginBottom: '1rem' }}>
            Ready to verify with <span className="gradient-text">zero trust</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Upload any document and verify its authenticity against the Solana blockchain in seconds. 
            No account required.
          </p>
          <Link to="/verify" className="btn-primary" style={{ ...styles.ctaBtn, fontSize: '1.05rem' }}>
            <Shield size={20} />
            Start Verifying
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div>
            <h3 className="gradient-text" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>ProofChain</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Blockchain Document Verification Platform
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Built on Solana • Secured by Cryptography • Powered by IPFS
          </div>
        </div>
      </footer>

      <style>{`
        .reveal-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-section.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      </div>
    </div>
  );
};

const features = [
  {
    icon: <Shield size={24} color="#00F0FF" />,
    iconBg: 'rgba(0, 240, 255, 0.1)',
    title: 'Zero-Knowledge Proofs',
    description: 'Verify document authenticity without revealing sensitive content using cryptographic selective disclosure.'
  },
  {
    icon: <Lock size={24} color="#8B5CF6" />,
    iconBg: 'rgba(139, 92, 246, 0.1)',
    title: 'IPFS Decentralized Storage',
    description: 'Documents are pinned on IPFS with content-addressed hashing — immutable, distributed, and permanent.'
  },
  {
    icon: <Zap size={24} color="#EC4899" />,
    iconBg: 'rgba(236, 72, 153, 0.1)',
    title: 'Solana Speed',
    description: 'Sub-second finality with Solana\'s 400ms block times. Verify documents in real-time across the globe.'
  },
  {
    icon: <FileCheck size={24} color="#10B981" />,
    iconBg: 'rgba(16, 185, 129, 0.1)',
    title: 'Tamper-Proof Records',
    description: 'SHA-256 document hashes stored on-chain create an unforgeable audit trail for every credential issued.'
  }
];

const steps = [
  {
    title: 'Upload Document',
    desc: 'An admin uploads the document. A SHA-256 hash is computed client-side — the file never leaves your browser.'
  },
  {
    title: 'Blockchain Registration',
    desc: 'The document hash and IPFS CID are written to a Solana Program Derived Address (PDA) via Anchor.'
  },
  {
    title: 'Instant Verification',
    desc: 'Anyone can verify authenticity by uploading the same document. Its hash is compared against the on-chain record.'
  }
];

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3, 3, 6, 0.75)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalContent: {
    background: 'rgba(12, 12, 18, 0.92)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px',
    padding: '2.5rem',
    width: '90%',
    maxWidth: '480px',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.15)',
    display: 'flex',
    flexDirection: 'column',
  },
  logoIcon: {
    width: '72px',
    height: '72px',
    margin: '0 auto',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(139, 92, 246, 0.15))',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
    padding: '8px'
  },
  closeBtn: {
    position: 'absolute',
    top: '1.25rem',
    right: '1.25rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-muted)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  authStep: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    width: '100%'
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  authStepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    flexShrink: 0
  },
  modalInput: {
    width: '100%',
    padding: '14px 18px',
    marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#F0F0F5',
    fontSize: '0.95rem',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
    boxSizing: 'border-box'
  },
  
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '2rem',
    overflow: 'hidden'
  },
  gridBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black 40%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black 40%, transparent 100%)'
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none'
  },
  orb1: {
    width: '500px',
    height: '500px',
    background: 'rgba(0, 240, 255, 0.08)',
    top: '10%',
    left: '-10%',
    animation: 'float 8s ease-in-out infinite'
  },
  orb2: {
    width: '400px',
    height: '400px',
    background: 'rgba(139, 92, 246, 0.08)',
    top: '30%',
    right: '-5%',
    animation: 'float 10s ease-in-out infinite reverse'
  },
  orb3: {
    width: '300px',
    height: '300px',
    background: 'rgba(236, 72, 153, 0.06)',
    bottom: '10%',
    left: '30%',
    animation: 'float 12s ease-in-out infinite'
  },
  heroContent: {
    textAlign: 'center',
    maxWidth: '800px',
    position: 'relative',
    zIndex: 2
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    borderRadius: '9999px',
    background: 'rgba(0, 240, 255, 0.06)',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    fontSize: '0.8rem',
    color: 'var(--neon-cyan)',
    marginBottom: '2rem',
    fontWeight: 500,
    letterSpacing: '0.02em'
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--neon-green)',
    boxShadow: '0 0 8px var(--neon-green)',
    animation: 'pulse 2s ease-in-out infinite'
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    fontFamily: 'var(--font-display)',
    fontWeight: 900,
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
    marginBottom: '1.5rem',
    color: 'var(--text-primary)'
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    margin: '0 auto 2.5rem',
    lineHeight: 1.7
  },
  heroCtas: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    fontSize: '1rem',
    fontWeight: 600,
    textDecoration: 'none'
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'var(--text-muted)',
    opacity: 0.5
  },
  
  statsSection: {
    padding: '4rem 2rem',
    borderTop: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(0, 0, 0, 0.3)'
  },
  statsGrid: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '3rem',
    flexWrap: 'wrap'
  },
  statItem: {
    textAlign: 'center'
  },
  statNumber: {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: '0.5rem'
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 500
  },
  statDivider: {
    width: '1px',
    height: '60px',
    background: 'var(--border-default)'
  },
  
  featuresSection: {
    padding: '6rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.5rem'
  },
  featureCard: {
    padding: '2rem',
    cursor: 'default'
  },
  featureIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem'
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: 'var(--text-primary)'
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.7
  },
  
  howSection: {
    padding: '6rem 2rem',
    maxWidth: '900px',
    margin: '0 auto'
  },
  stepsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem'
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative'
  },
  stepNumber: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '1px solid var(--border-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(0, 240, 255, 0.05)'
  },
  stepConnector: {
    position: 'absolute',
    bottom: '-1.5rem',
    width: '1px',
    height: '1.5rem',
    background: 'linear-gradient(to bottom, var(--border-glow), transparent)'
  },
  
  ctaSection: {
    padding: '4rem 2rem 6rem',
    maxWidth: '800px',
    margin: '0 auto'
  },
  ctaBanner: {
    padding: '4rem',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  
  footer: {
    borderTop: '1px solid var(--border-subtle)',
    padding: '2rem',
    background: 'rgba(0, 0, 0, 0.3)'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  }
};

export default Home;
