const { PrismaClient } = require('@prisma/client');
const { uploadDocument, listDocumentsByKeyValue } = require('../services/pinata.service');
const auditService = require('../services/audit.service');
const prisma = new PrismaClient();

const upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const { docHash, recipientEmail, aiDocType, aiKeywords } = req.body;
  if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });
  if (!recipientEmail) return res.status(400).json({ error: "Missing recipientEmail" });
  
  const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!recipient) return res.status(404).json({ error: "Recipient user not found" });

  const metadata = {
    ownerId: recipient.id,
    ownerEmail: recipient.email,
    issuerId: req.user.id,
    issuerEmail: req.user.email,
    docHash: docHash,
    aiDocType: aiDocType || 'General',
    aiKeywords: aiKeywords || '[]'
  };

  const ipfsCid = await uploadDocument(req.file.buffer, req.file.originalname, req.file.mimetype, metadata);

  await auditService.logAction(req.user.id, 'DOCUMENT_UPLOADED', `Uploaded document ${req.file.originalname}`, req.ip);

  res.status(201).json({ 
    message: "Upload successful", 
    document: {
      name: req.file.originalname,
      ipfsCid,
      docHash,
      ownerEmail: recipient.email
    } 
  });
};

const getDocuments = async (req, res) => {
  if (req.user.role === 'USER') {
    const files = await listDocumentsByKeyValue("ownerId", req.user.id);
    const myDocs = files.map(file => ({
      id: file.id,
      name: file.metadata.name,
      ipfsCid: file.ipfs_pin_hash,
      docHash: file.metadata.keyvalues.docHash,
      issuerEmail: file.metadata.keyvalues.issuerEmail,
      aiDocType: file.metadata.keyvalues.aiDocType,
      aiKeywords: file.metadata.keyvalues.aiKeywords,
      createdAt: file.date_pinned
    }));
    return res.json({ myDocs });
  } 
  
  if (req.user.role === 'ADMIN') {
    const files = await listDocumentsByKeyValue("issuerId", req.user.id);
    const issuedDocs = files.map(file => ({
      id: file.id,
      name: file.metadata.name,
      ipfsCid: file.ipfs_pin_hash,
      docHash: file.metadata.keyvalues.docHash,
      ownerEmail: file.metadata.keyvalues.ownerEmail,
      aiDocType: file.metadata.keyvalues.aiDocType,
      aiKeywords: file.metadata.keyvalues.aiKeywords,
      createdAt: file.date_pinned
    }));
    return res.json({ issuedDocs });
  }
  
  if (req.user.role === 'SUPER_ADMIN') {
    return res.json({ allDocs: [] });
  }
};

module.exports = {
  upload,
  getDocuments
};
