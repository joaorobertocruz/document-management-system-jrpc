const { randomUUID } = require('node:crypto');

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  createDocument(file) {
    if (!file) {
      throw this.createError(400, 'FILE_REQUIRED', 'Um arquivo deve ser enviado.');
    }

    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: process.env.DMS_DEFAULT_OWNER || 'local-user',
      filePath: file.path,
    };

    this.documentRepository.save(document);
    return this.toPublicDocument(document);
  }

  listDocuments() {
    return this.documentRepository.findAll();
  }

  getDocumentForDownload(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      throw this.createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    return document;
  }

  toPublicDocument({ filePath, ...document }) {
    return document;
  }

  createError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }
}

module.exports = DocumentService;