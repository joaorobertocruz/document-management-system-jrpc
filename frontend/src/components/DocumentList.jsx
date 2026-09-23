import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, isLoading, error, onRefresh }) {
  return (
    <section className="documents-panel" aria-labelledby="documents-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Arquivos enviados</p>
          <h2 id="documents-title">Seus documentos</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {isLoading && <p className="muted">Carregando documentos...</p>}
      {!isLoading && !error && documents.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum documento ainda</strong>
          <span>O próximo arquivo enviado aparecerá aqui.</span>
        </div>
      )}
      {!isLoading && documents.length > 0 && (
        <div className="document-list">
          {documents.map((document) => (
            <article className="document-row" key={document.id}>
              <div className="document-icon" aria-hidden="true">DOC</div>
              <div className="document-details">
                <strong>{document.originalName}</strong>
                <span>{formatFileSize(document.size)} · enviado em {formatDate(document.uploadedAt)}</span>
              </div>
              <DownloadButton documentId={document.id} fileName={document.originalName} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}