const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

const statusUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'REVOKED'])
  })
});

const roleUpdateSchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN'])
  })
});

router.use(authenticateToken);
router.use(requireRole(['SUPER_ADMIN']));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', validate(statusUpdateSchema), adminController.updateStatus);
router.put('/users/:id/role', validate(roleUpdateSchema), adminController.updateRole);

module.exports = router;
