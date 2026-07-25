import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, Zap, Lock, FileCheck, ArrowRight, ChevronDown, X, 
  CheckCircle, Database, Cpu, Globe, Key, FileCode, Search, HelpCircle, ChevronUp, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import toast from 'react-hot-toast';
import anime from 'animejs';
import ThreeCanvas from '../components/ThreeCanvas';
import ThemeToggle from '../components/ThemeToggle';
import { calculateSHA256 } from '../utils/hash';

const Home = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [activeFaq, setActiveFaq] = useState(null);

  const heroRef = useRef(null);
  const statsRef = useRef(null);

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

  useEffect(() => {
    anime({
      targets: '.hero-anime',
      translateY: [40, 0],
      opacity: [0, 1],
      delay: anime.stagger(120, { start: 200 }),
      duration: 1000,
      easing: 'easeOutCubic'
    });

    anime({
      targets: '.feature-card-anime',
      scale: [0.95, 1],
      opacity: [0, 1],
      delay: anime.stagger(100, { start: 600 }),
      duration: 800,
      easing: 'easeOutQuad'
    });

    anime({
      targets: '.stat-card-anime',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100, { start: 500 }),
      duration: 800,
      easing: 'easeOutCubic'
    });
  }, []);

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

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div style={{ overflow: 'hidden', height: showAuthModal ? '100vh' : 'auto' }}>
      {showAuthModal && (
        <div style={styles.modalOverlay}>
          <div className="card-glow animate-scale-in" style={styles.modalContent}>
            <button style={styles.closeBtn} onClick={() => setShowAuthModal(false)}><X size={20} /></button>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={styles.logoIcon}><img src="/logo.png" alt="ProofChain Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
              <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Secure Portal Access</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Strict Zero-Trust Network Access (ZTNA) Policy Enforced</p>
            </div>
            
            <div style={styles.stepContainer}>
              {!user ? (
                <div style={{ ...styles.authStep, opacity: 1 }}>
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
                <div style={{ ...styles.authStep, opacity: 1 }}>
                  <div style={styles.stepHeader}>
                    <div style={{ ...styles.authStepNumber, background: wallet.connected ? 'var(--neon-green)' : 'var(--neon-violet)' }}>2</div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Cryptographic Verification (Web3)</h4>
                  </div>
                  {!wallet.connected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                      <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--neon-green)', borderRadius: '8px', color: 'var(--neon-green)', textAlign: 'center', width: '100%', marginBottom: '1rem' }}>
                        ✓ Web2 Identity Verified ({user.email})
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Connect your Solana Phantom wallet to complete authorization.</p>
                      <WalletMultiButton style={{ background: 'var(--neon-violet)' }} />
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--neon-green)', borderRadius: '8px', color: 'var(--neon-green)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <Shield size={32} />
                      <strong>✓ Fully Authorized</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(16, 185, 129, 0.8)' }}>Redirecting to Secure Portal...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ filter: showAuthModal ? 'blur(10px) brightness(0.4)' : 'none', transition: 'all 0.3s ease', position: 'relative' }}>
        <ThreeCanvas />

        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 2.5rem', maxWidth: '1280px', margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="ProofChain Logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>ProofChain</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle showLabel={true} />
            <button onClick={handleGetStarted} className="btn-primary" style={{ padding: '8px 22px', fontSize: '0.9rem' }}>
              Sign In
            </button>
          </div>
        </header>

        <section ref={heroRef} style={styles.hero}>
          <div style={styles.heroContent}>
            <div className="hero-anime" style={styles.heroBadge}>
              <span style={styles.pulseDot} />
              <span>Solana Blockchain • IPFS Persistence • ZTNA Security</span>
            </div>

            <h1 className="hero-anime" style={styles.heroTitle}>
              Decentralized Trust for<br />
              <span className="gradient-text">Verifiable Digital Credentials</span>
            </h1>

            <p className="hero-anime" style={styles.heroSubtitle}>
              ProofChain provides institutional-grade document notarization combining sub-second Solana block speed, 
              IPFS content-addressed storage, and a strict Zero-Trust Network Access identity bridge.
            </p>

            <div className="hero-anime" style={styles.heroCtas}>
              <button onClick={handleGetStarted} className="btn-primary" style={{ ...styles.ctaBtn, padding: '16px 40px', fontSize: '1.15rem' }}>
                Get Started
                <ArrowRight size={20} />
              </button>
              <Link to="/verify" className="btn-outline" style={{ ...styles.ctaBtn, padding: '16px 36px', fontSize: '1.15rem' }}>
                <Search size={20} />
                Public Verifier
              </Link>
            </div>
          </div>
        </section>

        <section style={styles.statsSection}>
          <div style={styles.statsGrid}>
            <div className="card-glow stat-card-anime" style={styles.statCard}>
              <h3 style={styles.statNumber}>10x</h3>
              <p style={styles.statLabel}>Faster Verification</p>
            </div>
            <div className="card-glow stat-card-anime" style={styles.statCard}>
              <h3 style={styles.statNumber}>100%</h3>
              <p style={styles.statLabel}>Cryptographic Certainty</p>
            </div>
            <div className="card-glow stat-card-anime" style={styles.statCard}>
              <h3 style={styles.statNumber}>0</h3>
              <p style={styles.statLabel}>Knowledge Leaks</p>
            </div>
            <div className="card-glow stat-card-anime" style={styles.statCard}>
              <h3 style={styles.statNumber}>&lt; 1s</h3>
              <p style={styles.statLabel}>Solana Consensus</p>
            </div>
          </div>
        </section>

        <section style={styles.featuresSection}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>
              Built for <span className="gradient-text">Institutional Trust</span>
            </h2>
            <p style={{ maxWidth: '650px', margin: '0 auto', color: 'var(--text-secondary)' }}>
              ProofChain fuses enterprise database reliability with decentralized Web3 immutability.
            </p>
          </div>

          <div style={styles.featuresGrid}>
            {features.map((f, i) => (
              <div key={f.title} className="card-glow feature-card-anime" style={styles.featureCard}>
                <div style={{ ...styles.featureIcon, background: f.iconBg }}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.archSection}>
          <div style={styles.archContainer}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span className="badge badge-violet" style={{ marginBottom: '0.75rem' }}>Technical Deep Dive</span>
              <h2>Cryptographic Architecture Pillars</h2>
            </div>

            <div style={styles.pillarsGrid}>
              <div style={styles.pillarCard} className="card-glow">
                <Shield size={28} color="var(--neon-cyan)" />
                <h4>ZTNA Identity Bridge</h4>
                <p>Enforces a 1-to-1 database binding between Web2 email credentials and Solana Ed25519 public key addresses, evicting unauthenticated sessions automatically.</p>
              </div>
              <div style={styles.pillarCard} className="card-glow">
                <Database size={28} color="var(--neon-violet)" />
                <h4>Pinata IPFS Network</h4>
                <p>Document binaries are pinned across distributed IPFS storage nodes with content-addressed CIDs, guaranteeing metadata persistence without central storage points.</p>
              </div>
              <div style={styles.pillarCard} className="card-glow">
                <Cpu size={28} color="var(--neon-pink)" />
                <h4>Anchor PDA Program</h4>
                <p>Smart contract Program Derived Addresses (PDAs) store document verification flags deterministically using SHA-256 seeds on Solana's high-speed ledger.</p>
              </div>
              <div style={styles.pillarCard} className="card-glow">
                <Lock size={28} color="var(--neon-green)" />
                <h4>Dual-Layer Revocation</h4>
                <p>Combines immediate sub-second IPFS metadata key-value soft locking with permanent on-chain Anchor state revocation signatures for full lifecycle control.</p>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.useCasesSection}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>Versatile Deployment</span>
            <h2>Enterprise & Academic Use Cases</h2>
          </div>

          <div style={styles.useCaseGrid}>
            <div className="card-glow" style={styles.useCaseCard}>
              <Globe size={24} color="var(--neon-cyan)" />
              <h4>University & Academic Degrees</h4>
              <p>Issue immutable digital diplomas directly to student profiles. Employers verify authenticity in seconds without contacting registrar offices.</p>
            </div>
            <div className="card-glow" style={styles.useCaseCard}>
              <Key size={24} color="var(--neon-violet)" />
              <h4>Enterprise Legal Contracts</h4>
              <p>Notarize multi-signature corporate agreements on Solana. Require Super Admin approval before settlements are permanently minted.</p>
            </div>
            <div className="card-glow" style={styles.useCaseCard}>
              <FileCheck size={24} color="var(--neon-pink)" />
              <h4>Government & Audit Compliance</h4>
              <p>Maintain verifiable audit trails for compliance certificates, environmental reports, and regulatory filings with Zero-Knowledge verification.</p>
            </div>
          </div>
        </section>

        <section style={styles.faqSection}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>Help Center</span>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div style={styles.faqList}>
            {faqs.map((faq, idx) => (
              <div key={idx} className="card-glow" style={styles.faqItem} onClick={() => toggleFaq(idx)}>
                <div style={styles.faqQuestion}>
                  <span>{faq.q}</span>
                  {activeFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {activeFaq === idx && (
                  <div style={styles.faqAnswer}>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={styles.ctaSection}>
          <div className="card-glow" style={styles.ctaBanner}>
            <h2>Ready to experience <span className="gradient-text">Zero Trust Verification</span>?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem', maxWidth: '550px' }}>
              Join institutions and enterprise organizations managing tamper-proof credentials on Solana.
            </p>
            <button onClick={handleGetStarted} className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.15rem' }}>
              Launch Secure Portal
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

        <footer style={styles.footer}>
          <div style={styles.footerContent}>
            <div>
              <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>ProofChain</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Decentralized Document Verification Platform
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Solana Blockchain • Pinata IPFS • ZTNA Protocol
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const features = [
  {
    icon: <Shield size={24} color="var(--neon-cyan)" />,
    iconBg: 'rgba(0, 240, 255, 0.1)',
    title: 'Zero-Knowledge Privacy',
    description: 'Cryptographic SHA-256 hashing allows verification without exposing sensitive document content or personal user data.'
  },
  {
    icon: <Lock size={24} color="var(--neon-violet)" />,
    iconBg: 'rgba(139, 92, 246, 0.1)',
    title: 'IPFS Content-Addressing',
    description: 'Document files are pinned across Pinata IPFS node clusters, ensuring decentralized persistence and immutable content identifiers.'
  },
  {
    icon: <Zap size={24} color="var(--neon-pink)" />,
    iconBg: 'rgba(236, 72, 153, 0.1)',
    title: 'Sub-Second Solana Speed',
    description: 'Leverages Solana\'s 400ms block times to confirm and verify credential records instantly anywhere on earth.'
  },
  {
    icon: <FileCheck size={24} color="var(--neon-green)" />,
    iconBg: 'rgba(16, 185, 129, 0.1)',
    title: 'Dual-Layer Revocation',
    description: 'Soft-lock document access in real-time via IPFS metadata key-values or permanently revoke on-chain via Anchor smart contract.'
  }
];

const faqs = [
  {
    q: 'What makes ProofChain different from traditional databases?',
    a: 'Traditional databases are controlled by a single party and susceptible to internal tampering or data loss. ProofChain stores verification hashes on the immutable Solana blockchain and raw files on IPFS, providing mathematically guaranteed proof of authenticity.'
  },
  {
    q: 'Does ProofChain store my actual private document on the public blockchain?',
    a: 'No. ProofChain computes a cryptographic SHA-256 hash client-side inside your browser. Only the 64-character hash string and IPFS CID are stored on-chain. Your private document content never leaves local memory.'
  },
  {
    q: 'How does the Zero Trust Dual-Authentication (ZTNA) work?',
    a: 'ProofChain requires two matching credentials to unlock institutional features: first, valid Web2 email/password authentication, followed by a connected Solana Phantom wallet whose Ed25519 address matches the bound user record in the database.'
  },
  {
    q: 'Can issued credentials be revoked if a degree or license is canceled?',
    a: 'Yes. Issuers can perform a sub-second IPFS Metadata Soft-Lock to freeze public verification immediately, or sign an Anchor transaction on Solana to permanently record revocation status on-chain.'
  }
];

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(3, 3, 6, 0.75)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, padding: '1rem',
  },
  modalContent: {
    background: 'rgba(12, 12, 18, 0.92)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px', padding: '2.5rem',
    width: '90%', maxWidth: '480px', position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.15)',
    display: 'flex', flexDirection: 'column',
  },
  logoIcon: {
    width: '72px', height: '72px', margin: '0 auto', borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(139, 92, 246, 0.15))',
    border: '1px solid rgba(0, 240, 255, 0.3)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
    padding: '8px'
  },
  closeBtn: {
    position: 'absolute', top: '1.25rem', right: '1.25rem',
    background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)',
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
  },
  stepContainer: { display: 'flex', flexDirection: 'column', width: '100%' },
  authStep: {
    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px', padding: '1.5rem', transition: 'all 0.3s ease', width: '100%'
  },
  stepHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  authStepNumber: {
    width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#000',
    fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0
  },
  modalInput: {
    width: '100%', padding: '14px 18px', marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px', color: '#F0F0F5', fontSize: '0.95rem',
    fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box'
  },

  hero: {
    minHeight: '90vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    padding: '4rem 2rem 2rem', zIndex: 1
  },
  heroContent: { textAlign: 'center', maxWidth: '850px' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '8px 20px', borderRadius: '9999px',
    background: 'rgba(0, 240, 255, 0.06)', border: '1px solid rgba(0, 240, 255, 0.2)',
    fontSize: '0.85rem', color: 'var(--neon-cyan)', marginBottom: '2rem',
    fontWeight: 500, letterSpacing: '0.02em'
  },
  pulseDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)'
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', fontFamily: 'Outfit, sans-serif',
    fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem'
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', color: 'var(--text-secondary)',
    maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: 1.7
  },
  heroCtas: { display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    borderRadius: '12px', fontWeight: 600, textDecoration: 'none'
  },

  statsSection: { padding: '2rem 2rem 5rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
  statCard: { padding: '2.5rem 1.5rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  statNumber: { fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  statLabel: { fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 },

  featuresSection: { padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' },
  featureCard: { padding: '2rem', borderRadius: '20px' },
  featureIcon: {
    width: '52px', height: '52px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
  },
  featureTitle: { fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' },
  featureDesc: { fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 },

  archSection: { padding: '5rem 2rem', background: 'rgba(0, 0, 0, 0.4)', position: 'relative', zIndex: 2 },
  archContainer: { maxWidth: '1100px', margin: '0 auto' },
  pillarsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' },
  pillarCard: { padding: '2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem' },

  useCasesSection: { padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 },
  useCaseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  useCaseCard: { padding: '2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem' },

  faqSection: { padding: '5rem 2rem', maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 2 },
  faqList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  faqItem: { padding: '1.5rem 2rem', borderRadius: '16px', cursor: 'pointer' },
  faqQuestion: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '1.05rem' },
  faqAnswer: { marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem' },

  ctaSection: { padding: '4rem 2rem 6rem', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 },
  ctaBanner: { padding: '4rem 2rem', textAlign: 'center', borderRadius: '28px' },

  footer: { padding: '3rem 2rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.6)', position: 'relative', zIndex: 2 },
  footerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }
};

export default Home;
