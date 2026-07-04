const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/email.service');
const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
  const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const pendingAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'PENDING' } });
  
  
  const users = await prisma.user.findMany({ select: { createdAt: true } });
  
  
  const growthMap = {};
  users.forEach(u => {
    const month = new Date(u.createdAt).toLocaleString('default', { month: 'short' });
    growthMap[month] = (growthMap[month] || 0) + 1;
  });
  
  const chartData = Object.keys(growthMap).map(name => ({
    name,
    users: growthMap[name]
  }));

  
  if (chartData.length === 0) {
    chartData.push({ name: 'Jan', users: 0 }, { name: 'Feb', users: 0 });
  }

  res.json({ stats: { totalUsers, totalAdmins, pendingAdmins }, chartData });
};

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ users });
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json({ message: "Status updated successfully", user: { id: user.id, status: user.status } });
};

const updateRole = async (req, res) => {
  const { role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role }
  });
  res.json({ message: "Role updated successfully", user: { id: user.id, role: user.role } });
};

const getDocumentRequests = async (req, res) => {
  const requests = await prisma.documentRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
};

const updateDocumentRequest = async (req, res) => {
  const { status } = req.body;
  const request = await prisma.documentRequest.update({
    where: { id: req.params.id },
    data: { status }
  });

  if (status === 'APPROVED') {
    emailService.sendVerificationEmail(request.ownerEmail, request.name, request.docHash).catch(console.error);
  }

  res.json({ message: "Request updated successfully", request });
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateStatus,
  updateRole,
  getDocumentRequests,
  updateDocumentRequest
};
