const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching audit logs.' });
  }
};

module.exports = {
  getAuditLogs
};
