const { randomUUID } = require('node:crypto');

class DocumentService {
  constructor(documentRepository, fileRepository) {
    this.documentRepository = documentRepository;
    this.fileRepository = fileRepository;
  }

  createDocument(file) {
    if (!file) {
      throw this.createError(400, 'FILE_REQUIRED', 'Um arquivo deve ser enviado.');
    }

    if (!file.path || !this.fileRepository.isPathInsideStorage(file.path)) {
      this.cleanupFile(file.path);
      throw this.createError(500, 'STORAGE_ERROR', 'O arquivo não foi armazenado em local seguro.');
    }

    if (file.size === 0) {
      this.cleanupFile(file.path);
      throw this.createError(400, 'EMPTY_FILE', 'O arquivo não pode estar vazio.');
    }

    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: process.env.DMS_DEFAULT_OWNER || 'local-user',
      filePath: file.path,
    };

    try {
      this.documentRepository.save(document);
    } catch (error) {
      this.cleanupFile(file.path);
      throw this.createError(500, 'STORAGE_ERROR', 'Não foi possível registrar o documento.');
    }

    return this.toPublicDocument(document);
  }

  listDocuments() {
    return this.documentRepository.findAll().map((document) => this.toPublicDocument(document));
  }

  getDocumentForDownload(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      throw this.createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    if (!this.fileRepository.isPathInsideStorage(document.filePath)) {
      throw this.createError(500, 'STORAGE_ERROR', 'O caminho do arquivo é inválido.');
    }

    return document;
  }

  cleanupFile(filePath) {
    if (filePath) {
      this.fileRepository.removeFile(filePath);
    }
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