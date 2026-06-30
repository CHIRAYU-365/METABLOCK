require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PinataSDK } = require('pinata-web3');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Pinata initialization
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES (JWT / Prisma) ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { username, email, passwordHash }
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// --- DOCUMENT ROUTES (Pinata) ---

app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const { docHash } = req.body;
    if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });

    // Prepare file for Pinata
    const blob = new Blob([req.file.buffer]);
    const fileForPinata = new File([blob], req.file.originalname, { type: req.file.mimetype });
    
    // Upload to Pinata with Metadata mapped to custom JWT user
    const pinataRes = await pinata.upload.file(fileForPinata).addMetadata({
      name: req.file.originalname,
      keyValues: {
        ownerId: req.user.id,
        ownerEmail: req.user.email,
        docHash: docHash
      }
    });

    const ipfsCid = pinataRes.IpfsHash;

    res.status(201).json({ 
      message: "Upload successful", 
      document: {
        name: req.file.originalname,
        ipfsCid,
        docHash,
        ownerEmail: req.user.email
      } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    // Fetch user's documents using Pinata API filtering by ownerId from Custom JWT
    const files = await pinata.listFiles().keyValue("ownerId", req.user.id);

    const myDocs = files.map(file => ({
      id: file.id,
      name: file.metadata.name,
      ipfsCid: file.ipfs_pin_hash,
      docHash: file.metadata.keyvalues.docHash,
      createdAt: file.date_pinned
    }));

    // Simulated shared documents
    const sharedFiles = await pinata.listFiles().keyValue("sharedEmail", req.user.email);
    const sharedWithMe = sharedFiles.map(file => ({
      id: file.id,
      name: file.metadata.name,
      ipfsCid: file.ipfs_pin_hash,
      docHash: file.metadata.keyvalues.docHash,
      owner: { username: file.metadata.keyvalues.ownerEmail }
    }));

    res.json({ myDocs, sharedWithMe });
  } catch (error) {
    console.error("Pinata fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
