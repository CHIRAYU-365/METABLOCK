require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PinataSDK } = require('pinata-web3');
const rateLimit = require('express-rate-limit');
const app = express();
const prisma = new PrismaClient();
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
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
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Invalid email format" });
    if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) return res.status(400).json({ error: "User already exists" });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    let assignedRole = 'USER';
    let assignedStatus = 'ACTIVE';
    if (role === 'ADMIN') {
      assignedRole = 'ADMIN';
      assignedStatus = 'PENDING';
    } else if (role === 'SUPER_ADMIN') {
      assignedRole = 'SUPER_ADMIN';
      assignedStatus = 'ACTIVE';
    }
    const newUser = await prisma.user.create({
      data: { username, email, passwordHash, role: assignedRole, status: assignedStatus }
    });
    res.status(201).json({ message: "User registered successfully", role: newUser.role, status: newUser.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });
    if (user.status !== 'ACTIVE' && user.status !== 'APPROVED') {
      return res.status(403).json({ error: `Account is ${user.status}. Cannot login.` });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, username: true, email: true, role: true, status: true } });
  res.json({ user });
});
app.get('/api/superadmin/dashboard', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const pendingAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'PENDING' } });
    res.json({ stats: { totalUsers, totalAdmins, pendingAdmins } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/superadmin/users', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put('/api/superadmin/users/:id/status', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { status } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ message: "Status updated successfully", user: { id: user.id, status: user.status } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put('/api/superadmin/users/:id/role', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });
    res.json({ message: "Role updated successfully", user: { id: user.id, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/documents/upload', authenticateToken, requireRole(['ADMIN']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { docHash, recipientEmail } = req.body;
    if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });
    if (!recipientEmail) return res.status(400).json({ error: "Missing recipientEmail" });
    const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
    if (!recipient) return res.status(404).json({ error: "Recipient user not found" });
    const blob = new Blob([req.file.buffer]);
    const fileForPinata = new File([blob], req.file.originalname, { type: req.file.mimetype });
    const pinataRes = await pinata.upload.file(fileForPinata).addMetadata({
      name: req.file.originalname,
      keyValues: {
        ownerId: recipient.id,
        ownerEmail: recipient.email,
        issuerId: req.user.id,
        issuerEmail: req.user.email,
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
        ownerEmail: recipient.email
      } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'USER') {
      const files = await pinata.listFiles().keyValue("ownerId", req.user.id);
      const myDocs = files.map(file => ({
        id: file.id,
        name: file.metadata.name,
        ipfsCid: file.ipfs_pin_hash,
        docHash: file.metadata.keyvalues.docHash,
        issuerEmail: file.metadata.keyvalues.issuerEmail,
        createdAt: file.date_pinned
      }));
      return res.json({ myDocs });
    } 
    if (req.user.role === 'ADMIN') {
      const files = await pinata.listFiles().keyValue("issuerId", req.user.id);
      const issuedDocs = files.map(file => ({
        id: file.id,
        name: file.metadata.name,
        ipfsCid: file.ipfs_pin_hash,
        docHash: file.metadata.keyvalues.docHash,
        ownerEmail: file.metadata.keyvalues.ownerEmail,
        createdAt: file.date_pinned
      }));
      return res.json({ issuedDocs });
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return res.json({ allDocs: [] });
    }
  } catch (error) {
    console.error("Pinata fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
