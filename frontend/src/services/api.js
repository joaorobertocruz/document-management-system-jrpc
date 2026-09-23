const API_PREFIX = '/api';
const REQUEST_TIMEOUT_MS = 15000;

async function request(url, options = {}, signal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortRequest = () => controller.abort(signal.reason);

  if (signal) {
    if (signal.aborted) {
      abortRequest();
    } else {
      signal.addEventListener('abort', abortRequest, { once: true });
    }
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

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

export async function listDocuments({ signal } = {}) {
  const response = await request(`${API_PREFIX}/documents`, {}, signal);
  await parseResponse(response);
  return response.json();
}

export async function uploadDocument(file, { signal } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  }, signal);

  await parseResponse(response);
  return response.json();
}

export async function downloadDocument(id, { signal } = {}) {
  const response = await request(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`, {}, signal);
  await parseResponse(response);
  return response.blob();
}