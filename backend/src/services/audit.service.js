const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logAction = async (userId, action, details, ipAddress = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

module.exports = {
  logAction
};
