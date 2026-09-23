class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    const storedDocument = { ...document };
    this.documents.set(storedDocument.id, storedDocument);
    return { ...storedDocument };
  }

  findAll() {
    return Array.from(this.documents.values()).map((document) => ({ ...document }));
  }

  findById(id) {
    const document = this.documents.get(id);
    return document ? { ...document } : undefined;
  }
}

module.exports = DocumentRepository;