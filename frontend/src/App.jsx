import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/api';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DMS / Workspace</p>
          <h1>Document Management System</h1>
          <p className="header-copy">Um espaço simples para manter seus arquivos locais organizados.</p>
        </div>
        <div className="status-indicator"><span /> Armazenamento local</div>
      </header>
      <UploadComponent onUploaded={handleUploaded} />
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </main>
  );
}
