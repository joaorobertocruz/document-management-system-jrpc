const express = require('express');
const multer = require('multer');

function createDocumentRouter({ upload, documentController }) {
  const router = express.Router();

  router.post('/upload', upload.single('file'), documentController.upload);
  router.get('/documents', documentController.list);
  router.get('/documents/:id/download', documentController.download);

  router.use((error, _request, _response, next) => {
    if (error instanceof multer.MulterError) {
      error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      error.code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
      error.message = error.code === 'FILE_TOO_LARGE'
        ? 'O arquivo excede o limite permitido.'
        : 'A entrada do upload é inválida.';
    }

    next(error);
  });

  return router;
}

module.exports = createDocumentRouter;