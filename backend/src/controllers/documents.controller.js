const { PrismaClient } = require('@prisma/client');
const { uploadDocument, listDocumentsByKeyValue, listAllDocuments, updateDocumentMetadata } = require('../services/pinata.service');
const auditService = require('../services/audit.service');
const emailService = require('../services/email.service');
const prisma = new PrismaClient();

const upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const recipientEmail = req.body.recipientEmail || req.body.ownerEmail;
  if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });
  if (!recipientEmail) return res.status(400).json({ error: "Missing recipient email address" });

  let recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!recipient) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('DefaultUserPass123!', salt);
    recipient = await prisma.user.create({
      data: {
        username: recipientEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000),
        email: recipientEmail,
        passwordHash,
        role: 'USER',
        status: 'ACTIVE'
      }
    });
  }

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

  
  emailService.sendVerificationEmail(recipient.email, req.file.originalname, docHash)
    .then(info => console.log(`Recipient email dispatched to ${recipient.email}`))
    .catch(err => console.error(`Failed to dispatch email to ${recipient.email}:`, err.message));

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
      aiDocType: file.metadata.keyvalues.aiDocType,
      aiKeywords: file.metadata.keyvalues.aiKeywords,
      isLocked: file.metadata.keyvalues.isLocked === 'true',
      createdAt: file.date_pinned
    }));
    return res.json({ issuedDocs });
  }
  
  if (req.user.role === 'SUPER_ADMIN') {
    const files = await listAllDocuments();
    const allDocs = files.map(file => ({
      id: file.id,
      name: file.metadata.name,
      ipfsCid: file.ipfs_pin_hash,
      docHash: file.metadata.keyvalues.docHash,
      ownerEmail: file.metadata.keyvalues.ownerEmail,
      ownerId: file.metadata.keyvalues.ownerId,
      issuerEmail: file.metadata.keyvalues.issuerEmail,
      isLocked: file.metadata.keyvalues.isLocked === 'true',
      createdAt: file.date_pinned
    }));
    return res.json({ allDocs });
  }
};

const getRequests = async (req, res) => {
  const requests = await prisma.documentRequest.findMany({
    where: { issuerId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
};

const getPublicStatus = async (req, res) => {
  try {
    const files = await listDocumentsByKeyValue("docHash", req.params.hash);
    if (!files || files.length === 0) {
      return res.json({ isLocked: false }); 
    }
    const isLocked = files[0].metadata.keyvalues.isLocked === 'true';
    res.json({ isLocked });
  } catch (err) {
    res.status(500).json({ error: "Failed to check status" });
  }
};



const toggleLock = async (req, res) => {
  try {
    const { ipfsCid, isLocked } = req.body;
    if (!ipfsCid) return res.status(400).json({ error: "Missing ipfsCid" });
    
    
    if (req.user.role === 'USER') return res.status(403).json({ error: "Unauthorized" });

    
    const files = await listDocumentsByKeyValue("docHash", req.params.hash);
    if (!files || files.length === 0) return res.status(404).json({ error: "Document not found" });
    
    const file = files[0];
    const newKeyValues = {
      ...file.metadata.keyvalues,
      isLocked: isLocked ? 'true' : 'false'
    };

    await updateDocumentMetadata(ipfsCid, newKeyValues);
    await auditService.logAction(req.user.id, isLocked ? 'DOCUMENT_LOCKED' : 'DOCUMENT_UNLOCKED', `Toggled lock status for document ${req.params.hash}`, req.ip);

    res.json({ message: `Document successfully ${isLocked ? 'locked' : 'unlocked'}`, isLocked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lock status" });
  }
};

module.exports = {
  upload,
  getDocuments,
  getRequests,
  toggleLock,
  getPublicStatus
};
