const express = require('express');
const multer = require('multer');
const { upload } = require('../repositories/fileRepository');
const DocumentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');
const DocumentController = require('../controllers/documentController');

const documentRepository = new DocumentRepository();
const documentService = new DocumentService(documentRepository);
const documentController = new DocumentController(documentService);
const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

router.use((error, _request, _response, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    error.statusCode = 413;
    error.code = 'FILE_TOO_LARGE';
    error.message = 'O arquivo excede o limite permitido.';
  }

  next(error);
});

module.exports = router;