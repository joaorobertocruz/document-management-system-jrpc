const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('o fluxo de documentos suporta upload, listagem e download', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const formData = new FormData();
  formData.append('file', new Blob(['conteúdo de teste'], { type: 'text/plain' }), 'teste.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual((await listResponse.json())[0], document);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'conteúdo de teste');

  const missingResponse = await fetch(`${baseUrl}/documents/unknown/download`);
  assert.strictEqual(missingResponse.status, 404);
  assert.deepStrictEqual(await missingResponse.json(), {
    error: 'Documento não encontrado.',
    code: 'DOCUMENT_NOT_FOUND',
  });

  const storageDirectory = path.resolve(__dirname, '../storage');
  const storedFiles = await fs.readdir(storageDirectory);
  await Promise.all(
    storedFiles
      .filter((fileName) => fileName !== '.gitkeep')
      .map((fileName) => fs.unlink(path.join(storageDirectory, fileName))),
  );
});

test('upload sem arquivo retorna erro de validação', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/upload`, { method: 'POST' });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await response.json(), {
    error: 'Um arquivo deve ser enviado.',
    code: 'FILE_REQUIRED',
  });
});
