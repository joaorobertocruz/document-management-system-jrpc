class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findAll() {
    return Array.from(this.documents.values()).map(({ filePath, ...document }) => document);
  }

  findById(id) {
    return this.documents.get(id);
  }
}

module.exports = DocumentRepository;