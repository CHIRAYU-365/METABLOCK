import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BulkUpload = ({ onComplete }) => {
  const [csvData, setCsvData] = useState([]);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const { token } = useAuth();

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (results.errors.length) {
            toast.error("Error parsing CSV");
            return;
          }
          setCsvData(results.data);
        },
      });
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const processBulk = async () => {
    if (csvData.length === 0) return toast.error("No valid data found in CSV");
    
    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Process one by one (to not overwhelm the blockchain/backend rate limits)
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      // Expecting columns: Name, OwnerEmail
      if (!row.Name || !row.OwnerEmail) {
        failedCount++;
        errors.push(`Row ${i + 1}: Missing Name or OwnerEmail`);
        continue;
      }

      try {
        // Creating a dummy file for the bulk issuance, simulating an actual document
        const blob = new Blob([`Bulk Issued Certificate for ${row.Name} (${row.OwnerEmail})\nIssued Date: ${new Date().toISOString()}`], { type: 'text/plain' });
        const dummyFile = new File([blob], `${row.Name.replace(/\s+/g, '_')}_Certificate.txt`, { type: 'text/plain' });
        
        const formData = new FormData();
        formData.append('document', dummyFile);
        formData.append('ownerEmail', row.OwnerEmail);
        
        await axios.post(`${API_URL}/api/documents/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push(`Row ${i + 1} (${row.Name}): ${err.response?.data?.error || err.message}`);
      }
    }

    setResults({ successCount, failedCount, errors });
    setIsProcessing(false);
    toast.success(`Bulk operation complete. ${successCount} successful, ${failedCount} failed.`);
    if (onComplete) onComplete();
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={20} className="text-accent" /> Bulk Issue Certificates (CSV)
      </h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Upload a CSV file containing <strong>Name</strong> and <strong>OwnerEmail</strong> columns. 
        The system will automatically generate standard text certificates, mint them on Solana, and assign them to the specified emails.
      </p>

      {!results ? (
        <>
          <div style={{
            border: '2px dashed var(--border-color)', 
            borderRadius: '12px', 
            padding: '2rem', 
            textAlign: 'center',
            position: 'relative',
            cursor: 'pointer',
            backgroundColor: 'rgba(255,255,255,0.02)'
          }}>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload} 
              style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
            <Upload size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto' }} />
            <div style={{ fontWeight: '500' }}>
              {file ? file.name : "Click or drag CSV file here"}
            </div>
          </div>

          {csvData.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', color: 'var(--success)' }}>
                Successfully parsed {csvData.length} records.
              </div>
              <button 
                onClick={processBulk} 
                disabled={isProcessing}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {isProcessing ? `Processing...` : `Issue ${csvData.length} Certificates`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '1rem' }}>Bulk Issuance Results</h4>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> {results.successCount} Successful
            </div>
            {results.failedCount > 0 && (
              <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} /> {results.failedCount} Failed
              </div>
            )}
          </div>
          {results.errors.length > 0 && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--error)', maxHeight: '150px', overflowY: 'auto' }}>
              <strong>Error Details:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                {results.errors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}
          <button 
            onClick={() => { setResults(null); setFile(null); setCsvData([]); }} 
            className="btn-outline"
            style={{ marginTop: '1.5rem' }}
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
