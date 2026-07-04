const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auditService = require('../services/audit.service');

const prisma = new PrismaClient();

const register = async (req, res) => {
  const { username, email, password } = req.body;
  
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });
  if (existingUser) return res.status(400).json({ error: "User already exists" });
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  const newUser = await prisma.user.create({
    data: { 
      username, 
      email, 
      passwordHash, 
      role: 'USER', 
      status: 'ACTIVE' 
    }
  });
  
  await auditService.logAction(newUser.id, 'USER_REGISTERED', `User registered with email ${email}`, req.ip);

  res.status(201).json({ message: "User registered successfully", role: newUser.role, status: newUser.status });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
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
  
  await auditService.logAction(user.id, 'USER_LOGGED_IN', `User logged in`, req.ip);

  res.json({ 
    token, 
    user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, designation: user.designation } 
  });
};

const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id }, 
    select: { id: true, username: true, email: true, role: true, status: true, designation: true } 
  });
  res.json({ user });
};

const qrAttendance = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing user ID in QR payload" });
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true }
  });
  if (!user) return res.status(404).json({ error: "Invalid QR: User not found." });

  // Get the last check-in/out log to determine state
  const lastLog = await prisma.auditLog.findFirst({
    where: {
      userId: user.id,
      action: { in: ['CHECK_IN', 'CHECK_OUT'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  let action = 'CHECK_IN';
  let message = `Successfully Checked-In at ${new Date().toLocaleTimeString()}!`;
  let details = `Check-in recorded via QR code.`;

  if (lastLog && lastLog.action === 'CHECK_IN') {
    action = 'CHECK_OUT';
    const durationMs = new Date() - new Date(lastLog.createdAt);
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    details = `Check-out recorded via QR code. Shift duration: ${hours}h ${minutes}m.`;
    message = `Successfully Checked-Out at ${new Date().toLocaleTimeString()}! Shift: ${hours}h ${minutes}m.`;
  }

  await auditService.logAction(user.id, action, details, req.ip);

  res.json({ message, action, user: user.username });
};

module.exports = {
  register,
  login,
  getMe,
  qrAttendance
};
