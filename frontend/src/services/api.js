const API_PREFIX = '/api';

async function parseResponse(response) {
  if (response.ok) {
    return response;
  }

  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = null;
  }

  const error = new Error(errorData?.error || 'Não foi possível concluir a operação.');
  error.code = errorData?.code || 'REQUEST_ERROR';
  error.status = response.status;
  throw error;
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);
  await parseResponse(response);
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });

  await parseResponse(response);
  return response.json();
}

export async function downloadDocument(id) {
  const response = await fetch(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`);
  await parseResponse(response);
  return response.blob();
}