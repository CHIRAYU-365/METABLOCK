const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
  const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const pendingAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'PENDING' } });
  res.json({ stats: { totalUsers, totalAdmins, pendingAdmins } });
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

module.exports = {
  getDashboardStats,
  getUsers,
  updateStatus,
  updateRole
};
