class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  upload(request, response, next) {
    try {
      const document = this.documentService.createDocument(request.file);
      response.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  list(_request, response, next) {
    try {
      response.json(this.documentService.listDocuments());
    } catch (error) {
      next(error);
    }
  }

  download(request, response, next) {
    try {
      const document = this.documentService.getDocumentForDownload(request.params.id);

      response.download(document.filePath, document.originalName, (error) => {
        if (error && !response.headersSent) {
          error.statusCode = error.code === 'ENOENT' ? 404 : 500;
          error.code = error.code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'DOWNLOAD_ERROR';
          error.message = error.code === 'FILE_NOT_FOUND'
            ? 'Arquivo do documento não encontrado.'
            : 'Não foi possível baixar o documento.';
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;