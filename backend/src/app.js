// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const createDocumentRouter = require('./routes/documentRoutes');
const { upload, isPathInsideStorage, removeFile } = require('./repositories/fileRepository');
const DocumentRepository = require('./repositories/documentRepository');
const DocumentService = require('./services/documentService');
const DocumentController = require('./controllers/documentController');

const app = express();
const PORT = process.env.PORT || 3000;
const documentRepository = new DocumentRepository();
const documentService = new DocumentService(documentRepository, { isPathInsideStorage, removeFile });
const documentController = new DocumentController(documentService);
const documentRoutes = createDocumentRouter({ upload, documentController });

app.use(express.json());
app.use(documentRoutes);

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((_request, response) => {
  response.status(404).json({
    error: 'Rota não encontrada.',
    code: 'ROUTE_NOT_FOUND',
  });
});

app.use((error, _request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const publicErrorCodes = new Set([
    'DOCUMENT_NOT_FOUND',
    'FILE_NOT_FOUND',
    'FILE_REQUIRED',
    'FILE_TOO_LARGE',
    'EMPTY_FILE',
    'INVALID_UPLOAD',
    'DOWNLOAD_ERROR',
    'STORAGE_ERROR',
    'ROUTE_NOT_FOUND',
  ]);
  const code = publicErrorCodes.has(error.code) ? error.code : 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Erro interno do servidor.' : error.message;

  response.status(statusCode).json({
    error: message,
    code,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
