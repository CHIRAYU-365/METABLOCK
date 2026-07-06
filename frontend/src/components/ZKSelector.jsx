import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, Copy, Check, FileCheck } from 'lucide-react';
import { createVerifiablePayload, verifySelectiveDisclosure, sha256 } from '../utils/zkProof';
import toast from 'react-hot-toast';

const ZKSelector = ({ doc }) => {
  const [disclosed, setDisclosed] = useState({
    name: true,
    ownerEmail: true,
    aiDocType: true,
    ipfsCid: true
  });
  const [payload, setPayload] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateProof = async () => {
    const fields = {
      name: doc.name,
      ownerEmail: doc.ownerEmail || doc.issuerEmail || 'N/A', 
      aiDocType: doc.aiDocType || 'General',
      ipfsCid: doc.ipfsCid
    };

    const result = await createVerifiablePayload(fields);
    setPayload(result);
  };

  useEffect(() => {
    generateProof();
  }, [doc]);

  const toggleField = (field) => {
    setDisclosed(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getShareLink = () => {
    if (!payload) return '';

    const params = new URLSearchParams();
    params.set('zk', 'true');
    params.set('root', doc.docHash); 

    
    const fields = {
      name: doc.name,
      ownerEmail: doc.ownerEmail || doc.issuerEmail || 'N/A',
      aiDocType: doc.aiDocType || 'General',
      ipfsCid: doc.ipfsCid
    };

    Object.keys(fields).forEach(key => {
      if (disclosed[key]) {
        params.set(`df_${key}`, fields[key]);
        params.set(`ds_${key}`, payload.salts[key]);
      } else {
        params.set(`hh_${key}`, payload.fieldHashes[key]);
      }
    });

    return `${window.location.origin}/verify?${params.toString()}`;
  };

  const handleCopyLink = () => {
    const link = getShareLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("ZK Share Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getW3CCredential = () => {
    return {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "id": `urn:uuid:${doc.docHash}`,
      "type": ["VerifiableCredential", "ProofChainCertificate"],
      "issuer": `did:solana:${doc.issuerEmail || 'Issuer'}`,
      "issuanceDate": doc.createdAt || new Date().toISOString(),
      "credentialSubject": {
        "id": `did:email:${doc.ownerEmail || 'Recipient'}`,
        "claims": {
          name: disclosed.name ? doc.name : "[REDACTED/ZK-HIDDEN]",
          ownerEmail: disclosed.ownerEmail ? (doc.ownerEmail || doc.issuerEmail) : "[REDACTED/ZK-HIDDEN]",
          aiDocType: disclosed.aiDocType ? doc.aiDocType : "[REDACTED/ZK-HIDDEN]",
          ipfsCid: disclosed.ipfsCid ? doc.ipfsCid : "[REDACTED/ZK-HIDDEN]"
        }
      },
      "proof": {
        "type": "SolanaSignature2026",
        "verificationMethod": `solana-pda://${doc.docHash}`,
        "proofPurpose": "assertionMethod"
      }
    };
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <ShieldCheck className="text-accent" /> ZK Selective Disclosure
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Toggle fields to hide sensitive data. Generates a cryptographic verification proof links allowing verifiers to confirm authenticity without seeing hidden data.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.keys(disclosed).map(field => (
          <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontWeight: '600', textTransform: 'capitalize', fontSize: '0.9rem' }}>{field.replace('ai', 'AI ')}</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {disclosed[field] ? String(doc[field] || doc.issuerEmail || 'N/A') : '•••••••••••• (Cryptographically Hidden)'}
              </div>
            </div>
            <button onClick={() => toggleField(field)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
              {disclosed[field] ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button onClick={handleCopyLink} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          {copied ? <Check size={16} /> : <Copy size={16} />} Copy ZK Verification Link
        </button>
        <button 
          onClick={() => {
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(getW3CCredential(), null, 2))}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", jsonString);
            downloadAnchor.setAttribute("download", `w3c_credential_${doc.docHash.slice(0, 8)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }} 
          className="btn-outline" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileCheck size={16} /> Download W3C Credential
        </button>
      </div>
    </div>
  );
};

export default ZKSelector;
