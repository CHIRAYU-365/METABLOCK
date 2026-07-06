const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { error: 'Upload rate limit exceeded. Please wait an hour before uploading more.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

router.use(apiLimiter);
router.use(authenticateToken);

router.post('/upload', requireRole(['ADMIN']), uploadLimiter, upload.single('file'), documentsController.upload);
router.get('/', documentsController.getDocuments);
router.get('/requests', requireRole(['ADMIN']), documentsController.getRequests);

module.exports = router;
