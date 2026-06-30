import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as anchor from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { calculateSHA256 } from '../utils/hash';
import { getProvider, PROGRAM_ID } from '../utils/solana';
import idl from '../utils/blockchain.json';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const { token, user } = useAuth();
  const wallet = useWallet();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.myDocs);
      setSharedDocs(res.data.sharedWithMe);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");
    if (!wallet.connected) return alert("Please connect your Solana wallet first");

    setUploading(true);
    try {
      // 1. Calculate Hash locally (WebCrypto)
      const docHash = await calculateSHA256(file);
      
      // 2. Upload raw file to Backend -> Pinata IPFS (acting as our metadata DB too)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docHash', docHash);

      const res = await axios.post('http://localhost:3001/api/documents/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const ipfsCid = res.data.document.ipfsCid;

      // 3. Blockchain Registration
      const provider = getProvider(wallet);
      const program = new anchor.Program(idl, provider);
      
      // Decode hex docHash to 32 bytes Buffer
      const docHashBytes = Buffer.from(docHash, 'hex');

      // Derive PDA
      const documentRecordPda = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("document"), docHashBytes],
        PROGRAM_ID
      )[0];

      // Pass the 32-byte array to the program
      await program.methods.registerDocument(Array.from(docHashBytes), ipfsCid).accounts({
        documentRecord: documentRecordPda,
        issuer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).rpc();

      alert(`Successfully registered on IPFS & Solana Blockchain! Hash: ${docHash.substring(0,10)}...`);
      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async (docHash) => {
    if (!wallet.connected) return alert("Please connect your wallet first");
    if (!window.confirm("Are you sure you want to revoke this document on the blockchain? This action is irreversible.")) return;

    try {
      const provider = getProvider(wallet);
      const program = new anchor.Program(idl, provider);

      // Decode hex docHash to 32 bytes Buffer
      const docHashBytes = Buffer.from(docHash, 'hex');

      const documentRecordPda = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("document"), docHashBytes],
        PROGRAM_ID
      )[0];

      // Pass the 32-byte array to the program
      await program.methods.revokeDocument(Array.from(docHashBytes)).accounts({
        documentRecord: documentRecordPda,
        issuer: wallet.publicKey
      }).rpc();

      alert("Document successfully revoked on the Solana blockchain!");
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Failed to revoke: " + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={styles.header}>
        <h1>Welcome, {user?.username || 'Issuer'}</h1>
        {!wallet.connected && <div style={styles.warningBanner}>Please connect your Solana wallet to issue or revoke documents.</div>}
      </div>

      <div style={styles.grid}>
        {/* Upload Section */}
        <div className="glass-panel" style={styles.uploadCard}>
          <h3>Issue New Document</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Select a file. We will hash it locally, store it on IPFS via our gateway, and execute an Anchor program transaction to register it.
          </p>
          <form onSubmit={handleUpload}>
            <div style={styles.dropZone}>
              <input 
                type="file" 
                onChange={e => setFile(e.target.files[0])} 
                style={styles.fileInput}
              />
              <div style={styles.dropZoneText}>
                {file ? file.name : "Click or drag file to upload"}
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={uploading || !file || !wallet.connected}
            >
              {uploading ? 'Processing...' : 'Register Document'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>My Documents (from Pinata Metadata)</h3>
          {documents.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No documents pinned yet.</p>
          ) : (
            <div style={styles.list}>
              {documents.map(doc => (
                <div key={doc.id} className="glass-panel" style={styles.listItem}>
                  <div>
                    <h4 style={{ color: 'var(--accent-secondary)' }}>{doc.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Hash: {doc.docHash?.substring(0, 16)}...
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      View IPFS
                    </a>
                    <button 
                      className="btn-outline" 
                      onClick={() => handleRevoke(doc.docHash)} 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Shared With Me</h3>
          {sharedDocs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No shared documents.</p>
          ) : (
             <div style={styles.list}>
              {sharedDocs.map(doc => (
                <div key={doc.id} className="glass-panel" style={styles.listItem}>
                  <div>
                    <h4 style={{ color: 'var(--accent-primary)' }}>{doc.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Owner: {doc.owner?.username}
                    </span>
                  </div>
                  <div>
                    <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      View IPFS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '2rem'
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: 'var(--warning)',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1rem',
    border: '1px solid rgba(245, 158, 11, 0.2)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem',
  },
  uploadCard: {
    padding: '2rem',
    height: 'fit-content',
  },
  dropZone: {
    border: '2px dashed var(--border-color)',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: 'rgba(0,0,0,0.2)',
    transition: 'border-color 0.2s',
  },
  fileInput: {
    opacity: 0,
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    cursor: 'pointer'
  },
  dropZoneText: {
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  listItem: {
    padding: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

export default Dashboard;
