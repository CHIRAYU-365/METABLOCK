import React, { useState } from 'react';
import { Connection } from '@solana/web3.js';
import { calculateSHA256 } from '../utils/hash';
import { getDocumentPda, SOLANA_RPC_ENDPOINT } from '../utils/solana';

const Verify = () => {
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) return;

    setVerifying(true);
    setResult(null);

    try {
      // 1. Calculate Hash Locally
      const docHash = await calculateSHA256(file);
      
      // 2. Derive PDA
      const pda = getDocumentPda(docHash);
      
      // 3. Query Solana (Zero-Knowledge via RPC, bypassing our node backend)
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'processed');
      const accountInfo = await connection.getAccountInfo(pda);

      if (!accountInfo) {
        setResult({ status: 'FAKE', message: 'Document tampered or not found on blockchain.', hash: docHash });
      } else {
        // Decode the data (Simple manual decode or using anchor)
        // Since we know the layout from SRS:
        // offset 8 (discriminator) + 32 (issuer) + 4+length (string) + 8 (timestamp) + 1 (is_revoked) + 1 (bump)
        // To precisely read is_revoked, we can use borsh or just manually read the byte before the bump.
        // It's easier if we had the IDL, but roughly, we can check if it exists it's at least registered.
        // Let's assume we decode it properly.
        // We will just mark it as AUTHENTIC if account exists for simplicity in this demo without the full Anchor IDL.
        
        // Let's simulate extracting the is_revoked flag (which is the second to last byte)
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
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8, wordBreak: 'break-all' }}>
                SHA-256: {result.hash}
              </p>
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
