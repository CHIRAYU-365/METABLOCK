import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Camera, CalendarCheck } from 'lucide-react';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      // Small timeout to allow element rendering
      setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          }, false);
          
          scanner.render(async (decodedText) => {
            try {
              await scanner.clear();
              setShowScanner(false);
              const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
              const res = await axios.post(`${API_URL}/api/auth/qr-attendance`, { userId: decodedText });
              toast.success(res.data.message, { duration: 6000 });
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.error || "Invalid QR Code or Scan Error");
            }
          }, (err) => {});
        } catch (e) {
          console.error("Scanner init error:", e);
        }
      }, 100);
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Error clearing scanner", e));
      }
    };
  }, [showScanner]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={styles.card}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login to ProofChain</h2>
        {error && <div style={styles.error}>{error}</div>}
        
        {showScanner ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--accent-secondary)' }}>Point Attendance QR Code at Camera</h4>
            <div id="reader" style={{ width: '100%', maxWidth: '350px', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}></div>
            <button onClick={() => setShowScanner(false)} className="btn-outline" style={{ width: '100%' }}>
              Cancel Scanner
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={() => setShowScanner(true)} 
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', background: 'var(--accent-secondary)' }}
            >
              <Camera size={18} /> Tap to Scan Attendance QR
            </button>
            <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          </>
        )}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70vh',
  },
  card: {
    padding: '3rem',
    width: '100%',
    maxWidth: '450px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--error)',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  }
};
export default Login;
