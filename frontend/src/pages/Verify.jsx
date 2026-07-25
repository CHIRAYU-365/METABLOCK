import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Connection } from '@solana/web3.js';
import { calculateSHA256 } from '../utils/hash';
import { abstractHash } from '../utils/mask';
import { getDocumentPda, SOLANA_RPC_ENDPOINT } from '../utils/solana';
import toast from 'react-hot-toast';
import { Copy, Check, ShieldCheck, EyeOff, Upload, FileSearch, Loader2, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { verifySelectiveDisclosure } from '../utils/zkProof';

const Verify = () => {
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const zk = params.get('zk');
    const hashParam = params.get('hash');
    
    if (zk === 'true') {
      verifyZkProof(params);
    } else if (hashParam) {
      verifyByHash(hashParam);
    }
  }, [location.search]);

  const verifyZkProof = async (params) => {
    setVerifying(true);
    setResult(null);
    try {
      const rootHash = params.get('root');
      if (!rootHash) {
        setResult({ status: 'ERROR', message: 'Missing ZK Root Hash parameter.' });
        return;
      }

      
      const disclosedFields = {};
      const disclosedSalts = {};
      const hiddenFieldHashes = {};
      const fields = ['name', 'ownerEmail', 'aiDocType', 'ipfsCid'];

      fields.forEach(f => {
        const val = params.get(`df_${f}`);
        const salt = params.get(`ds_${f}`);
        const hash = params.get(`hh_${f}`);
        if (val !== null) {
          disclosedFields[f] = val;
          disclosedSalts[f] = salt;
        } else if (hash !== null) {
          hiddenFieldHashes[f] = hash;
        }
      });

      const isZkValid = await verifySelectiveDisclosure(rootHash, disclosedFields, disclosedSalts, hiddenFieldHashes);
      if (!isZkValid) {
        setResult({ status: 'FAKE', message: 'ZK selective disclosure proof fails validation. The data was tampered with.', hash: rootHash });
        return;
      }

      
      const pda = getDocumentPda(rootHash);
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      const accountInfo = await connection.getAccountInfo(pda);

      if (!accountInfo) {
        setResult({ status: 'FAKE', message: 'ZK proof matches local calculations, but root hash is not registered on Solana.', hash: rootHash });
        return;
      }

      const data = accountInfo.data;
      const isRevoked = data[data.length - 2] === 1;

      if (isRevoked) {
        setResult({ status: 'REVOKED', message: 'This credential was revoked by the issuer on-chain.', hash: rootHash });
      } else {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        let isLocked = false;
        try {
          const res = await axios.get(`${API_URL}/api/documents/public/${rootHash}/status`);
          isLocked = res.data.isLocked;
        } catch (e) {
          console.error("Failed to fetch lock status from IPFS backend");
        }

        if (isLocked) {
          setResult({ status: 'FAKE', message: 'This credential is Temporarily Locked by the issuer.', hash: rootHash });
        } else {
          setResult({
            status: 'AUTHENTIC',
            isZk: true,
            disclosedFields,
            hiddenFieldHashes,
            message: 'ZK Cryptographic Proof and Solana ledger record are both fully authentic!',
            hash: rootHash
          });
        }
      }
    } catch (err) {
      console.error(err);
      setResult({ status: 'ERROR', message: 'Verification error during ZK processing.' });
    } finally {
      setVerifying(false);
    }
  };

  const verifyByHash = async (docHashHex) => {
    setVerifying(true);
    setResult(null);
    try {
      const pda = getDocumentPda(docHashHex);
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      const accountInfo = await connection.getAccountInfo(pda);
      if (!accountInfo) {
        setResult({ status: 'FAKE', message: 'Document tampered or not found on blockchain.', hash: docHashHex });
        return;
      }
      const data = accountInfo.data;
      const isRevoked = data[data.length - 2] === 1; 
      if (isRevoked) {
        setResult({ status: 'REVOKED', message: 'Document was revoked by the issuer.', hash: docHashHex });
      } else {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        let isLocked = false;
        try {
          const res = await axios.get(`${API_URL}/api/documents/public/${docHashHex}/status`);
          isLocked = res.data.isLocked;
        } catch (e) {
          console.error("Failed to fetch lock status from IPFS backend");
        }

        if (isLocked) {
          setResult({ status: 'FAKE', message: 'This credential is Temporarily Locked by the issuer.', hash: docHashHex });
        } else {
          setResult({ status: 'AUTHENTIC', message: 'Cryptographic proof verified on Solana.', hash: docHashHex });
        }
      }
    } catch (err) {
      console.error(err);
      setResult({ status: 'ERROR', message: 'Verification error' });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success('Hash copied to clipboard!', { id: 'copy' });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) return;
    setVerifying(true);
    setResult(null);
    try {
      const docHash = await calculateSHA256(file);
      const pda = getDocumentPda(docHash);
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'processed');
      const accountInfo = await connection.getAccountInfo(pda);
      if (!accountInfo) {
        setResult({ status: 'FAKE', message: 'Document tampered or not found on blockchain.', hash: docHash });
      } else {
        const data = accountInfo.data;
        const isRevoked = data[data.length - 2] === 1;
        if (isRevoked) {
          setResult({ status: 'REVOKED', message: 'Document was revoked by the issuer.', hash: docHash });
        } else {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          let isLocked = false;
          try {
            const res = await axios.get(`${API_URL}/api/documents/public/${docHash}/status`);
            isLocked = res.data.isLocked;
          } catch (e) {
            console.error("Failed to fetch lock status");
          }
          
          if (isLocked) {
            setResult({ status: 'FAKE', message: 'This credential is Temporarily Locked by the issuer.', hash: docHash });
          } else {
            setResult({ status: 'AUTHENTIC', message: 'Cryptographic proof verified on Solana.', hash: docHash });
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to verify with the blockchain network.');
      setResult({ status: 'ERROR', message: 'Failed to verify with the blockchain network.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'AUTHENTIC': return {
        icon: <CheckCircle2 size={24} />,
        color: 'var(--neon-green)',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.2)',
        glow: '0 0 30px rgba(16, 185, 129, 0.1)'
      };
      case 'FAKE': return {
        icon: <XCircle size={24} />,
        color: 'var(--neon-red)',
        bg: 'rgba(239, 68, 68, 0.08)',
        border: 'rgba(239, 68, 68, 0.2)',
        glow: '0 0 30px rgba(239, 68, 68, 0.1)'
      };
      case 'REVOKED': return {
        icon: <AlertTriangle size={24} />,
        color: 'var(--neon-amber)',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.2)',
        glow: '0 0 30px rgba(245, 158, 11, 0.1)'
      };
      default: return {
        icon: <AlertTriangle size={24} />,
        color: 'var(--text-secondary)',
        bg: 'rgba(255, 255, 255, 0.04)',
        border: 'rgba(255, 255, 255, 0.1)',
        glow: 'none'
      };
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container} className="animate-fade-in">
        {}
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <FileSearch size={28} color="var(--neon-cyan)" />
          </div>
          <h1 style={styles.title}>
            <span className="gradient-text">Zero-Knowledge</span> Verification
          </h1>
          <p style={styles.subtitle}>
            Verify document authenticity against the Solana blockchain. 
            Your file is hashed client-side — it never leaves your browser.
          </p>
        </div>

        {}
        <div className="card-glow" style={styles.card}>
          <form onSubmit={handleVerify}>
            <div 
              style={{
                ...styles.dropZone,
                ...(dragActive ? styles.dropZoneActive : {}),
                ...(file ? styles.dropZoneHasFile : {})
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                onChange={e => { setFile(e.target.files[0]); setResult(null); }} 
                style={styles.fileInput}
              />
              <div style={styles.dropContent}>
                {file ? (
                  <>
                    <div style={styles.fileIcon}>
                      <ShieldCheck size={28} color="var(--neon-cyan)" />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>
                      {file.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {(file.size / 1024).toFixed(1)} KB • Click to change
                    </span>
                  </>
                ) : (
                  <>
                    <div style={styles.uploadIcon}>
                      <Upload size={32} color="var(--text-muted)" />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      Drop your document here
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      or click to browse • Any file type supported
                    </span>
                  </>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={styles.verifyBtn}
              disabled={verifying || !file}
            >
              {verifying ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Running Cryptographic Verification...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Verify Document
                </>
              )}
            </button>
          </form>

          {}
          {result && (() => {
            const cfg = getStatusConfig(result.status);
            return (
              <div style={{
                ...styles.resultBox,
                background: cfg.bg,
                borderColor: cfg.border,
                boxShadow: cfg.glow
              }} className="animate-scale-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <h3 style={{ fontSize: '1.1rem', color: cfg.color, fontWeight: 700 }}>
                    {result.status}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.message}</p>
                
                {}
                {result.isZk && (
                  <div style={styles.zkBox}>
                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Selective Disclosure Claims
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.keys(result.disclosedFields).map(k => (
                        <div key={k} style={styles.zkRow}>
                          <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {k.replace('ai', 'AI ')}
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                            {result.disclosedFields[k]}
                          </span>
                        </div>
                      ))}
                      {Object.keys(result.hiddenFieldHashes).map(k => (
                        <div key={k} style={styles.zkRow}>
                          <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {k.replace('ai', 'AI ')}
                          </span>
                          <span style={{ color: 'var(--neon-amber)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                            <EyeOff size={12} /> Hidden
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {result.hash && (
                  <div style={styles.hashRow}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.7 }}>
                      SHA-256: {abstractHash(result.hash, 8, 8)}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(result.hash)} 
                      style={{ background: 'transparent', color: copied === result.hash ? 'var(--neon-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                      {copied === result.hash ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 72px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  container: {
    width: '100%',
    maxWidth: '620px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.08)'
  },
  title: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    marginBottom: '0.75rem',
    fontWeight: 800,
    letterSpacing: '-0.03em'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    maxWidth: '500px',
    margin: '0 auto',
    fontSize: '0.95rem',
    lineHeight: 1.7
  },
  card: {
    padding: '2rem',
  },
  dropZone: {
    border: '2px dashed var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '3rem 2rem',
    textAlign: 'center',
    position: 'relative',
    cursor: 'pointer',
    background: 'var(--bg-elevated)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  dropZoneActive: {
    borderColor: 'var(--neon-cyan)',
    background: 'rgba(0, 240, 255, 0.03)',
    boxShadow: 'inset 0 0 40px rgba(0, 240, 255, 0.03), 0 0 20px rgba(0, 240, 255, 0.05)'
  },
  dropZoneHasFile: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderStyle: 'solid',
    background: 'rgba(0, 240, 255, 0.02)'
  },
  fileInput: {
    opacity: 0,
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    cursor: 'pointer'
  },
  dropContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  uploadIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  fileIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.25rem'
  },
  verifyBtn: {
    width: '100%',
    marginTop: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    fontSize: '1rem'
  },
  resultBox: {
    marginTop: '2rem',
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
  },
  zkBox: {
    marginTop: '1rem',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)'
  },
  zkRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid var(--border-subtle)'
  },
  hashRow: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'space-between'
  }
};

export default Verify;
