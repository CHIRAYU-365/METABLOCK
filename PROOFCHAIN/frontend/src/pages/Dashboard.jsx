import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Check, QrCode } from 'lucide-react';
import { abstractHash } from '../utils/mask';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [copied, setCopied] = useState(null);
  const { token, user } = useAuth();
  useEffect(() => {
    fetchDocuments();
  }, []);
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
  return (
    <div className="animate-fade-in">
      <div style={styles.header}>
        <h1>Welcome, {user?.username}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View and verify your issued certificates.</p>
      </div>
      <div className="dashboard-full-grid">
        <div style={{ width: '100%' }}>
          <h3 style={{ marginBottom: '1rem' }}>My Certificates</h3>
          {loadingDocs ? (
            <div style={styles.list}>
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel skeleton" style={{ height: '80px' }}></div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>You don't have any certificates issued to you yet.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {documents.map(doc => (
                <div key={doc.id} className="glass-panel" style={styles.listItem}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '8px' }}>
                      <QRCodeSVG 
                        value={`${window.location.origin}/verify?hash=${doc.docHash}`} 
                        size={80} 
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                      />
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--accent-secondary)' }}>{doc.name}</h4>
                    <div style={styles.hash}>
                      Hash: {abstractHash(doc.docHash)}
                      <button onClick={() => copyToClipboard(doc.docHash, 'Hash')} style={{ background: 'transparent', color: copied === doc.docHash ? 'var(--success)' : 'inherit' }}>
                        {copied === doc.docHash ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      IPFS: {abstractHash(doc.ipfsCid, 4, 4)}
                      <button onClick={() => copyToClipboard(doc.ipfsCid, 'IPFS CID')} style={{ background: 'transparent', color: copied === doc.ipfsCid ? 'var(--success)' : 'inherit' }}>
                        {copied === doc.ipfsCid ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                      Issued by: {doc.issuerEmail}
                    </span>
                    {(doc.aiDocType || doc.aiKeywords) && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-secondary)' }}>
                          {doc.aiDocType || 'General'}
                        </span>
                        {doc.aiKeywords && doc.aiKeywords !== '[]' && JSON.parse(doc.aiKeywords).map((kw, i) => (
                          <span key={i} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View File <ExternalLink size={14} />
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
