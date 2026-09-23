import { useEffect, useRef, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/api';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  async function refreshDocuments(signal) {
    const currentVersion = requestVersion.current + 1;
    requestVersion.current = currentVersion;
    setIsLoading(true);
    setError('');

    try {
      const nextDocuments = await listDocuments({ signal });
      if (currentVersion === requestVersion.current) {
        setDocuments(nextDocuments);
      }
    } catch (loadError) {
      if (!signal?.aborted && currentVersion === requestVersion.current) {
        setError(loadError.message);
      }
    } finally {
      if (currentVersion === requestVersion.current) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    refreshDocuments(controller.signal);
    return () => controller.abort();
  }, []);

  function handleUploaded(document) {
    requestVersion.current += 1;
    setError('');
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((currentDocument) => currentDocument.id !== document.id),
    ]);
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
