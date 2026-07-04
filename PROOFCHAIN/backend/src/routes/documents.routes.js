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

router.use(authenticateToken);

router.post('/upload', requireRole(['ADMIN']), uploadLimiter, upload.single('file'), documentsController.upload);
router.get('/', documentsController.getDocuments);
router.get('/requests', requireRole(['ADMIN']), documentsController.getRequests);
router.post('/:docHash/send-email', requireRole(['ADMIN']), documentsController.sendEmail);

module.exports = router;
