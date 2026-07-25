import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Check, ShieldCheck, Award, FileText, Download } from 'lucide-react';
import { abstractHash } from '../utils/mask';
import { QRCodeSVG } from 'qrcode.react';
import CertificateCanvas from '../components/CertificateCanvas';
import ZKSelector from '../components/ZKSelector';
import { Connection } from '@solana/web3.js';
import { getDocumentPda, SOLANA_RPC_ENDPOINT } from '../utils/solana';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [copied, setCopied] = useState(null);
  const [signedDocs, setSignedDocs] = useState({});
  const [selectedDocId, setSelectedDocId] = useState(null);
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
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await axios.get(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.myDocs || []);
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

  const handleSignOwnership = async (docHash) => {
    if (!wallet.connected) return toast.error("Please connect your Phantom wallet first");
    try {
      const message = new TextEncoder().encode(`I verify ownership of document with hash: ${docHash}`);
      const signature = await wallet.signMessage(message);
      
      setSignedDocs(prev => ({ ...prev, [docHash]: true }));
      toast.success("Cryptographic signature verified successfully!", { duration: 4000 });
    } catch (err) {
      console.error(err);
      toast.error("Signature failed or rejected");
    }
  };

  const downloadMyIDCard = (name, designation, email, userId) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#030304');
    grad.addColorStop(0.5, '#0c0c10');
    grad.addColorStop(1, '#111118');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(139, 92, 246, 0.05)';
    ctx.beginPath();
    ctx.arc(400, 600, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F0F0F5';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ProofChain', 200, 60);

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 11px Space Grotesk, sans-serif';
    ctx.fillText('BLOCKCHAIN VERIFIED', 200, 80);

    ctx.fillStyle = '#71717A';
    ctx.font = '10px Space Grotesk, sans-serif';
    ctx.fillText('Document Verification Platform', 200, 95);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(360, 110);
    ctx.stroke();

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(name.toUpperCase(), 200, 160);

    ctx.fillStyle = '#F0F0F5';
    ctx.font = 'italic 14px Space Grotesk, sans-serif';
    ctx.fillText(designation, 200, 190);

    ctx.fillStyle = '#71717A';
    ctx.font = '12px Space Grotesk, sans-serif';
    ctx.fillText(email, 200, 215);

    const svgElement = document.getElementById("myAttendanceQR");
    let svgBlob;
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    } else {
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const tempString = new XMLSerializer().serializeToString(tempSvg);
      svgBlob = new Blob([tempString], { type: 'image/svg+xml;charset=utf-8' });
    }
    
    const url = URL.createObjectURL(svgBlob);
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(130, 250, 140, 140, 12);
      ctx.fill();

      ctx.drawImage(qrImg, 140, 260, 120, 120);
      URL.revokeObjectURL(url);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(40, 450);
      ctx.lineTo(360, 450);
      ctx.stroke();

      ctx.fillStyle = '#71717A';
      ctx.font = '9px Space Grotesk, sans-serif';
      ctx.fillText('Blockchain Document Verification', 200, 480);
      ctx.fillText('Powered by Solana & IPFS', 200, 500);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 10px Space Grotesk, sans-serif';
      ctx.fillText('EMPLOYEE ATTENDANCE CARD', 200, 540);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${name.replace(/\s+/g, '_')}_ProofChain_ID.png`;
      link.click();
    };
    qrImg.src = url;
  };

  const visibleDocs = documents.filter(doc => !revokedDocs[doc.docHash]);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>
            Welcome, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and verify your issued certificates.</p>
        </div>
      </div>

      {/* QR Card */}
      <div className="card-glow" style={styles.qrCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={styles.qrWrapper}>
            <QRCodeSVG value={user?.id || 'N/A'} size={110} id="myAttendanceQR" bgColor="#ffffff" fgColor="#000000" />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>
              <span className="gradient-text-subtle">Personal Attendance QR</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Show this QR code to the scanner to automatically record your attendance.
            </p>
            <button 
              onClick={() => downloadMyIDCard(user?.username, user?.designation || 'Developer', user?.email, user?.id)} 
              className="btn-primary" 
              style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Download ID Card
            </button>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <FileText size={20} color="var(--neon-cyan)" />
          <h3>My Certificates</h3>
          <span className="badge badge-cyan">{visibleDocs.length}</span>
        </div>

        {loadingDocs ? (
          <div style={styles.list}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel skeleton" style={{ height: '100px' }}></div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any certificates issued to you yet.</p>
          </div>
        ) : visibleDocs.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>All issued certificates have been revoked.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {visibleDocs.map(doc => (
              <React.Fragment key={doc.id}>
              <div className="card-glow" style={styles.listItem}>
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
                    <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '0.25rem' }}>{doc.name}</h4>
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
                      Issued by: {doc.issuerEmail}
                    </span>
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
                  <button 
                    onClick={() => setSelectedDocId(selectedDocId === doc.id ? null : doc.id)} 
                    className="btn-outline" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Award size={14} /> Certificate
                  </button>
                  <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View <ExternalLink size={14} />
                  </a>
                  {signedDocs[doc.docHash] ? (
                    <span className="badge badge-green" style={{ padding: '6px 10px' }}>
                      <ShieldCheck size={12} /> Verified
                    </span>
                  ) : (
                    <button onClick={() => handleSignOwnership(doc.docHash)} className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>
                      Sign to Verify
                    </button>
                  )}
                </div>
              </div>
              
              {selectedDocId === doc.id && (
                <div className="card-glow animate-scale-in" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Verifiable Certificate</h4>
                    <CertificateCanvas doc={doc} />
                  </div>
                  <div>
                    <ZKSelector doc={doc} />
                  </div>
                </div>
              )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  qrCard: {
    padding: '2rem',
  },
  qrWrapper: {
    background: '#fff',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.05)'
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

export default Dashboard;
