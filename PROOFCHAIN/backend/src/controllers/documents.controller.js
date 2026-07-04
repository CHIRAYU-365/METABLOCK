const { PrismaClient } = require('@prisma/client');
const { uploadDocument, listDocumentsByKeyValue } = require('../services/pinata.service');
const auditService = require('../services/audit.service');
const emailService = require('../services/email.service');
const prisma = new PrismaClient();

const upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const { docHash, recipientEmail, aiDocType, aiKeywords, requireMultiSig, txData } = req.body;
  if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });
  if (!recipientEmail) return res.status(400).json({ error: "Missing recipientEmail" });
  
  const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!recipient) return res.status(404).json({ error: "Recipient user not found" });

  const existingRequest = await prisma.documentRequest.findUnique({ where: { docHash } });
  if (existingRequest) {
    return res.status(400).json({ error: "This document is already pending multi-sig approval or registered on the network." });
  }

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

  if (requireMultiSig === 'true') {
    await prisma.documentRequest.create({
      data: {
        docHash,
        ipfsCid,
        name: req.file.originalname,
        ownerEmail: recipient.email,
        issuerId: req.user.id,
        issuerEmail: req.user.email,
        aiDocType: aiDocType || 'General',
        aiKeywords: aiKeywords || '[]',
        txData: txData || null,
        status: 'PENDING'
      }
    });
    
    await auditService.logAction(req.user.id, 'DOCUMENT_MULTISIG_REQUESTED', `Requested multi-sig for document ${req.file.originalname}`, req.ip);
    
    return res.status(201).json({
      message: "Multi-signature requested successfully. Waiting for Super Admin approval.",
      requiresApproval: true
    });
  }

  await auditService.logAction(req.user.id, 'DOCUMENT_UPLOADED', `Uploaded document ${req.file.originalname}`, req.ip);

  
  emailService.sendVerificationEmail(recipient.email, req.file.originalname, docHash).catch(console.error);

  res.status(201).json({ 
    message: "Upload successful", 
    requiresApproval: false,
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

const getRequests = async (req, res) => {
  const requests = await prisma.documentRequest.findMany({
    where: { issuerId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
};



module.exports = {
  upload,
  getDocuments,
  getRequests
};
