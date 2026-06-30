require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { PinataSDK } = require('pinata-web3');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

// Pinata initialization
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

// Multer setup for handling file uploads (stored in memory to stream to Pinata)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware for JWT auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, solanaPubkey } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: "Username taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, solanaPubkey }
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, solanaPubkey: user.solanaPubkey } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DOCUMENT ROUTES ---

app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    // The docHash is computed by the React frontend via WebCrypto and sent in the body
    const { docHash } = req.body;
    if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });

    // Upload to Pinata IPFS
    const blob = new Blob([req.file.buffer]);
    const fileForPinata = new File([blob], req.file.originalname, { type: req.file.mimetype });
    
    const pinataRes = await pinata.upload.file(fileForPinata);
    const ipfsCid = pinataRes.IpfsHash;

    // Save metadata to Database
    const doc = await prisma.document.create({
      data: {
        ownerId: req.user.id,
        name: req.file.originalname,
        ipfsCid,
        docHash
      }
    });

    res.status(201).json({ message: "Upload successful", document: doc });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const myDocs = await prisma.document.findMany({
      where: { ownerId: req.user.id }
    });
    
    const sharedWithMe = await prisma.documentShare.findMany({
      where: { sharedWithUserId: req.user.id },
      include: { document: { include: { owner: { select: { username: true } } } } }
    });

    res.json({ 
      myDocs, 
      sharedWithMe: sharedWithMe.map(s => s.document) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/:id/share', authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const { shareWithUsername } = req.body;

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized or document not found" });
    }

    const targetUser = await prisma.user.findUnique({ where: { username: shareWithUsername } });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const share = await prisma.documentShare.create({
      data: {
        documentId,
        sharedWithUserId: targetUser.id
      }
    });

    res.json({ message: "Shared successfully", share });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
