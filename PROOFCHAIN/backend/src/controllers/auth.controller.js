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
    user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status } 
  });
};

const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id }, 
    select: { id: true, username: true, email: true, role: true, status: true } 
  });
  res.json({ user });
};

module.exports = {
  register,
  login,
  getMe
};
