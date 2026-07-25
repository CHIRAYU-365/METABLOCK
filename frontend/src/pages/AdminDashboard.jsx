import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as anchor from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { calculateSHA256 } from '../utils/hash';
import { abstractHash } from '../utils/mask';
import { getProvider, detectRpcEndpoint, PROGRAM_ID, getDocumentPda, SOLANA_RPC_ENDPOINT } from '../utils/solana';
import idl from '../utils/blockchain.json';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Check, QrCode, Mail } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Connection } from '@solana/web3.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BulkUpload from '../components/BulkUpload';
import { analyzeDocument } from '../utils/aiService';
import { useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'issue';
  const [documents, setDocuments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [requireMultiSig, setRequireMultiSig] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [copied, setCopied] = useState(null);
  const [revokedDocs, setRevokedDocs] = useState({});
  const { token, user } = useAuth();
  const wallet = useWallet();
  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documents.length > 0) {
      checkRevocationStatuses();
    }
  }, [documents]);

  const checkRevocationStatuses = async () => {
    const statuses = {};
    try {
      const rpcUrl = SOLANA_RPC_ENDPOINT;
      const connection = new Connection(rpcUrl, 'confirmed');
      for (const doc of documents) {
        try {
          const pda = getDocumentPda(doc.docHash);
          const accountInfo = await connection.getAccountInfo(pda);
          if (accountInfo) {
            const data = accountInfo.data;
            const isRevoked = data[data.length - 2] === 1;
            statuses[doc.docHash] = isRevoked;
          }
        } catch (e) {
          console.error("Error reading PDA status", e);
        }
      }
      setRevokedDocs(statuses);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleDocs = documents.filter(doc => !revokedDocs[doc.docHash]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [docsRes, reqsRes] = await Promise.all([
        axios.get(`${API_URL}/api/documents`, { headers }),
        axios.get(`${API_URL}/api/documents/requests`, { headers }).catch(() => ({ data: { requests: [] } }))
      ]);
      setDocuments(docsRes.data.issuedDocs || []);
      setRequests(reqsRes.data.requests || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success(`${type} copied to clipboard!`, { id: 'copy' });
    setTimeout(() => setCopied(null), 2000);
  };
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    if (!recipientEmail) return toast.error("Please enter the recipient's email");
    if (!wallet.connected || !wallet.publicKey) return toast.error("Please connect your Solana wallet (Phantom) first");
    if (wallet.wallet?.adapter?.name?.toLowerCase().includes('metamask')) {
      return toast.error("ProofChain runs on Solana. Please disconnect MetaMask and select Phantom Wallet.");
    }
    setUploading(true);
    try {
      const docHash = await calculateSHA256(file);
      
      
      const aiMeta = analyzeDocument(file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('docHash', docHash);
      formData.append('recipientEmail', recipientEmail);
      formData.append('aiDocType', aiMeta.docType);
      formData.append('aiKeywords', JSON.stringify(aiMeta.keywords));
      formData.append('requireMultiSig', requireMultiSig);

      const res = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.requiresApproval) {
        toast.success(res.data.message, { duration: 6000 });
        setFile(null);
        setRecipientEmail('');
        setRequireMultiSig(false);
        return;
      }

      const ipfsCid = res.data.document.ipfsCid;
      const provider = await getProvider(wallet);
      const program = new anchor.Program(idl, provider);
      const docHashBytes = Buffer.from(docHash, 'hex');
      const documentRecordPda = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("document"), docHashBytes],
        PROGRAM_ID
      )[0];
      const txId = await program.methods.registerDocument(Array.from(docHashBytes), ipfsCid).accounts({
        documentRecord: documentRecordPda,
        issuer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).rpc();
      toast.success(
        <div>
          Successfully registered! <br/>
          <a href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent-primary)' }}>View on Explorer</a>
        </div>, 
        { duration: 5000 }
      );
      setFile(null);
      setRecipientEmail('');
      setRequireMultiSig(false);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      let errorMsg = err.response?.data?.error || err.message || "Upload failed";
      if (errorMsg.includes("already in use") || errorMsg.includes("0x0")) {
        errorMsg = "This document has already been registered on the blockchain! Try uploading a different or modified file.";
      }
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };
  const handleRevoke = async (docHash) => {
    if (!wallet.connected) return toast.error("Please connect your wallet first");
    if (!window.confirm("Are you sure you want to revoke this document on the blockchain? This action is irreversible.")) return;
    try {
      const provider = await getProvider(wallet);
      const program = new anchor.Program(idl, provider);
      const docHashBytes = Buffer.from(docHash, 'hex');
      const documentRecordPda = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("document"), docHashBytes],
        PROGRAM_ID
      )[0];
      const txId = await program.methods.revokeDocument(Array.from(docHashBytes)).accounts({
        documentRecord: documentRecordPda,
        issuer: wallet.publicKey
      }).rpc();
      toast.success(
        <div>
          Document revoked! <br/>
          <a href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent-primary)' }}>View on Explorer</a>
        </div>,
        { duration: 5000 }
      );
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to revoke: " + err.message);
    }
  };

  const handleToggleLock = async (docHash, ipfsCid, currentLockedStatus) => {
    try {
      const res = await axios.post(`${API_URL}/api/documents/${docHash}/lock`, {
        ipfsCid,
        isLocked: !currentLockedStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to change lock status");
    }
  };

  const handleMintApprovedRequest = async (req) => {
    if (!wallet.connected) return toast.error("Please connect your wallet first");
    try {
      const provider = await getProvider(wallet);
      const program = new anchor.Program(idl, provider);
      const docHashBytes = Buffer.from(req.docHash, 'hex');
      const documentRecordPda = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("document"), docHashBytes],
        PROGRAM_ID
      )[0];
      const txId = await program.methods.registerDocument(Array.from(docHashBytes), req.ipfsCid).accounts({
        documentRecord: documentRecordPda,
        issuer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).rpc();
      toast.success(
        <div>
          Multi-Sig Document successfully minted! <br/>
          <a href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent-primary)' }}>View on Explorer</a>
        </div>, 
        { duration: 5000 }
      );
      
      
      fetchDocuments();
    } catch (err) {
      console.error(err);
      let errorMsg = err.message || "Failed to mint";
      if (errorMsg.includes("already in use") || errorMsg.includes("0x0")) {
        errorMsg = "This document has already been registered on the blockchain!";
      }
      toast.error(errorMsg);
    }
  };

  
  const generateChartData = () => {
    const dataMap = {};
    documents.forEach(doc => {
      const d = new Date(doc.timestamp);
      
      const day = isNaN(d.getTime()) ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap[day] = (dataMap[day] || 0) + 1;
    });
    return Object.keys(dataMap).map(name => ({ name, documents: dataMap[name] }));
  };
  const chartData = generateChartData();

  return (
    <div className="page-container animate-fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>
            <span className="gradient-text">Admin</span> Dispatch Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Issue and manage certificates as {user?.username}.</p>
        </div>
        {!wallet.connected && (
          <div style={styles.warningBanner}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠ Please connect your Solana wallet to issue or revoke documents.
            </span>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {activeTab === 'issue' && (
          <>
            {}
            <div className="card-glow" style={styles.uploadCard}>
          <h3 style={{ marginBottom: '0.5rem' }}>
            <span className="gradient-text-subtle">Issue New Document</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Select a file and assign it to a user. Stored on IPFS and registered on Solana.
          </p>
          <form onSubmit={handleUpload}>
            <div className="input-group" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recipient Email Address
              </label>
              <input 
                type="email" 
                required
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="e.g. recipient@domain.com"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(0, 240, 255, 0.4)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none',
                  cursor: 'text',
                  position: 'relative',
                  zIndex: 10,
                  boxSizing: 'border-box',
                  boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
                }}
              />
            </div>
            <div className="drop-zone" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', marginTop: '1rem', border: '2px dashed rgba(255, 255, 255, 0.15)', borderRadius: '12px' }}>
              <input 
                type="file" 
                onChange={e => setFile(e.target.files[0])} 
                style={{
                  opacity: 0,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  zIndex: 5
                }}
              />
              <div style={{ color: file ? 'var(--neon-cyan)' : 'var(--text-muted)', fontWeight: 500, textAlign: 'center', pointerEvents: 'none' }}>
                {file ? file.name : "Click or drag file to upload"}
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="multiSig" 
                checked={requireMultiSig} 
                onChange={(e) => setRequireMultiSig(e.target.checked)} 
                style={{ width: 'auto', accentColor: 'var(--neon-cyan)' }}
              />
              <label htmlFor="multiSig" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Require Multi-Signature (Super Admin Approval)
              </label>
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }}
              disabled={uploading || !file || !recipientEmail || !wallet.connected}
            >
              {uploading ? 'Processing...' : 'Register & Issue Document'}
            </button>
          </form>
        </div>
        
        {}
        <BulkUpload onComplete={fetchDocuments} />
        
        {}
        {requests.length > 0 && (
          <div style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3>Pending Multi-Sig Requests</h3>
              <span className="badge badge-amber">{requests.length}</span>
            </div>
            <div style={styles.list}>
              {requests.map(req => (
                <div key={req.id} className="card-glow" style={{...styles.listItem, borderLeft: req.status === 'APPROVED' ? '3px solid var(--neon-green)' : '3px solid var(--neon-amber)'}}>
                  <div>
                    <h4 style={{ color: 'var(--neon-cyan)' }}>{req.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Owner: {req.ownerEmail}
                    </span>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                      Status: <span className={`badge badge-${req.status === 'APPROVED' ? 'green' : req.status === 'REJECTED' ? 'red' : 'amber'}`}>{req.status}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {req.status === 'APPROVED' && (
                      <button 
                        onClick={() => handleMintApprovedRequest(req)}
                        className="btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        Mint to Blockchain
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === 'admin_stats' && (
        <>
        {}
        {chartData.length > 0 && (
          <div className="card-glow" style={{ marginTop: '2rem', padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>
              <span className="gradient-text-subtle">Certificates Issued Over Time</span>
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '10px', fontFamily: 'Space Grotesk' }} 
                    itemStyle={{ color: 'var(--neon-cyan)' }} 
                  />
                  <Line type="monotone" dataKey="documents" stroke="url(#chartGradient)" strokeWidth={3} dot={{ r: 4, fill: 'var(--neon-cyan)' }} activeDot={{ r: 6, fill: 'var(--neon-violet)' }} />
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--neon-cyan)" />
                      <stop offset="100%" stopColor="var(--neon-violet)" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3>Certificates Issued by Me</h3>
              <span className="badge badge-cyan">{visibleDocs.length}</span>
            </div>
          </div>
          {loadingDocs ? (
            <div style={styles.list}>
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel skeleton" style={{ height: '100px' }}></div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>You haven't issued any certificates yet.</p>
            </div>
          ) : visibleDocs.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>All issued certificates are revoked.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {visibleDocs.map(doc => (
                <div key={doc.id} className="card-glow" style={styles.listItem}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                    <div style={styles.qrSmall}>
                      <QRCodeSVG 
                        value={`${window.location.origin}/verify?hash=${doc.docHash}`} 
                        size={72} 
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ color: 'var(--neon-cyan)' }}>{doc.name}</h4>
                      <div style={styles.hash}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {abstractHash(doc.docHash)}
                        </span>
                        <button onClick={() => copyToClipboard(doc.docHash, 'Hash')} style={{ background: 'transparent', color: copied === doc.docHash ? 'var(--neon-green)' : 'var(--text-muted)', display: 'flex', padding: '2px' }}>
                          {copied === doc.docHash ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        IPFS: {abstractHash(doc.ipfsCid, 4, 4)}
                        <button onClick={() => copyToClipboard(doc.ipfsCid, 'IPFS CID')} style={{ background: 'transparent', color: copied === doc.ipfsCid ? 'var(--neon-green)' : 'var(--text-muted)', display: 'flex', padding: '2px' }}>
                          {copied === doc.ipfsCid ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Owner: {doc.ownerEmail}
                      </span>
                      {revokedDocs[doc.docHash] && (
                        <span className="badge badge-red" style={{ marginTop: '4px' }}>REVOKED ON BLOCKCHAIN</span>
                      )}
                      {doc.isLocked && !revokedDocs[doc.docHash] && (
                        <span className="badge badge-amber" style={{ marginTop: '4px' }}>TEMPORARILY LOCKED</span>
                      )}
                      {(doc.aiDocType || doc.aiKeywords) && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-violet">{doc.aiDocType || 'General'}</span>
                          {doc.aiKeywords && doc.aiKeywords !== '[]' && JSON.parse(doc.aiKeywords).map((kw, i) => (
                            <span key={i} className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      IPFS <ExternalLink size={14} />
                    </a>
                    {revokedDocs[doc.docHash] ? (
                      <span className="badge badge-red" style={{ padding: '6px 10px' }}>Revoked</span>
                    ) : (
                      <>
                        <button 
                          className="btn-outline" 
                          onClick={() => handleToggleLock(doc.docHash, doc.ipfsCid, doc.isLocked)} 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: doc.isLocked ? 'var(--neon-green)' : 'var(--neon-amber)', color: doc.isLocked ? 'var(--neon-green)' : 'var(--neon-amber)' }}
                        >
                          {doc.isLocked ? 'Unlock' : 'Lock'}
                        </button>
                        <button 
                          className="btn-danger" 
                          onClick={() => handleRevoke(doc.docHash)} 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '2rem'
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    color: 'var(--neon-amber)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    marginTop: '1rem',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    fontSize: '0.9rem'
  },
  uploadCard: {
    padding: '2rem',
    height: 'fit-content',
  },
  fileInput: {
    opacity: 0,
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    cursor: 'pointer'
  },
  qrSmall: {
    background: '#fff',
    padding: '6px',
    borderRadius: '8px'
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
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  hash: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-muted)',
  }
};

export default AdminDashboard;
