import React, { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';

const CertificateCanvas = ({ doc }) => {
  const canvasRef = useRef(null);

  const drawCertificate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set high-resolution dimensions for printing (A4 aspect ratio)
    canvas.width = 1200;
    canvas.height = 850;

    // Draw dark premium background
    ctx.fillStyle = '#0b0b0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw inner accent border
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Draw secondary golden border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

    // Title: PROOFCHAIN SECURE REGISTRY
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 36px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROOFCHAIN SECURE REGISTRY', canvas.width / 2, 130);

    // Subtitle
    ctx.fillStyle = '#a0aec0';
    ctx.font = 'italic 20px Inter, sans-serif';
    ctx.fillText('Solana Cryptographic Certificate of Authenticity', canvas.width / 2, 170);

    // Main Certificate text
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Inter, sans-serif';
    ctx.fillText('This certifies that the document', canvas.width / 2, 270);

    // Document Name
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 38px Outfit, Inter, sans-serif';
    ctx.fillText(doc.name.toUpperCase(), canvas.width / 2, 330);

    // Recipient Email
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Inter, sans-serif';
    ctx.fillText(`is officially registered to: ${doc.ownerEmail || 'Authorized Recipient'}`, canvas.width / 2, 400);

    // Cryptographic Hash info
    ctx.fillStyle = '#a0aec0';
    ctx.font = '16px monospace';
    ctx.fillText(`SHA-256 Hash: ${doc.docHash}`, canvas.width / 2, 470);
    ctx.fillText(`IPFS CID: ${doc.ipfsCid}`, canvas.width / 2, 500);

    // AI Classification badge (if present)
    if (doc.aiDocType) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 100, 530, 200, 40, 20);
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(`CLASSIFIED: ${doc.aiDocType}`, canvas.width / 2, 555);
    }

    // Embed QR Code for scanning
    try {
      const verifyUrl = `${window.location.origin}/verify?hash=${doc.docHash}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 150,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      const qrImage = new Image();
      qrImage.src = qrDataUrl;
      qrImage.onload = () => {
        // Draw white frame for QR code
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(canvas.width / 2 - 80, 610, 160, 160);
        ctx.drawImage(qrImage, canvas.width / 2 - 75, 615, 150, 150);

        // Verification scan text
        ctx.fillStyle = '#a0aec0';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Scan to Verify on Solana Ledger', canvas.width / 2, 790);
      };
    } catch (err) {
      console.error('Failed to render QR on canvas', err);
    }
  };

  useEffect(() => {
    drawCertificate();
  }, [doc]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${doc.name.replace(/\s+/g, '_')}_Verification_Certificate.png`;
    link.href = url;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          maxWidth: '550px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }} 
      />
      <button onClick={handleDownload} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
        <Download size={18} /> Download High-Res Certificate
      </button>
    </div>
  );
};

export default CertificateCanvas;
