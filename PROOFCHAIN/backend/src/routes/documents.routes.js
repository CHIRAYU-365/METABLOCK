const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authenticateToken);

router.post('/upload', requireRole(['ADMIN']), upload.single('file'), documentsController.upload);
router.get('/', documentsController.getDocuments);
router.get('/requests', requireRole(['ADMIN']), documentsController.getRequests);

module.exports = router;
