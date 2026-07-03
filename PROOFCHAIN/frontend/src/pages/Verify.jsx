import React, { useState } from 'react';
import { Connection } from '@solana/web3.js';
import { calculateSHA256 } from '../utils/hash';
import { getDocumentPda, SOLANA_RPC_ENDPOINT } from '../utils/solana';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';
const Verify = () => {
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);
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
          setResult({ status: 'AUTHENTIC', message: 'Cryptographic proof verified on Solana.', hash: docHash });
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
  return (
    <div className="animate-fade-in" style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="gradient-text">Zero-Knowledge Verification</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Check authenticity directly against the Solana Ledger. The file never leaves your browser.
          </p>
        </div>
        <form onSubmit={handleVerify}>
          <div style={styles.dropZone}>
            <input 
              type="file" 
              onChange={e => { setFile(e.target.files[0]); setResult(null); }} 
              style={styles.fileInput}
            />
            <div style={styles.dropZoneText}>
              {file ? file.name : "Drop document here to verify"}
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1.5rem' }}
            disabled={verifying || !file}
          >
            {verifying ? 'Running Cryptographic Verification...' : 'Verify Document'}
          </button>
        </form>
        {result && (
          <div style={{...styles.resultBox, ...(
            result.status === 'AUTHENTIC' ? styles.authentic : 
            result.status === 'FAKE' ? styles.fake : 
            result.status === 'REVOKED' ? styles.revoked : styles.error
          )}}>
            <h3 style={{ marginBottom: '0.5rem' }}>Status: {result.status}</h3>
            <p>{result.message}</p>
            {result.hash && (
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-all' }}>
                <span>SHA-256: {result.hash}</span>
                <button onClick={() => copyToClipboard(result.hash)} style={{ background: 'transparent', color: copied === result.hash ? 'var(--success)' : 'inherit' }}>
                  {copied === result.hash ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
  },
  card: {
    padding: '3rem',
    width: '100%',
    maxWidth: '600px',
  },
  dropZone: {
    border: '2px dashed var(--accent-secondary)',
    borderRadius: '12px',
    padding: '3rem',
    textAlign: 'center',
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    transition: 'all 0.2s',
  },
  fileInput: {
    opacity: 0,
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    cursor: 'pointer'
  },
  dropZoneText: {
    color: 'var(--text-primary)',
    fontWeight: '500',
    fontSize: '1.1rem'
  },
  resultBox: {
    marginTop: '2rem',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid',
  },
  authentic: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'var(--success)',
    color: 'var(--success)'
  },
  fake: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'var(--error)',
    color: 'var(--error)'
  },
  revoked: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'var(--warning)',
    color: 'var(--warning)'
  },
  error: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'var(--text-secondary)',
    color: 'var(--text-primary)'
  }
};
export default Verify;
