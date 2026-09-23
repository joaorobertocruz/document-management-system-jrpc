 # Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web para envio, consulta e download de documentos, com armazenamento dos arquivos no filesystem local e metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos por formulário `multipart/form-data`.
- Listagem dos documentos disponíveis.
- Download de um documento pelo identificador.
- Associação de cada documento a um usuário proprietário.
- Validação de arquivo obrigatório e limite máximo de tamanho configurável.
- Interface React para upload, listagem, download e apresentação de estados de carregamento e erro.
- Endpoint de verificação de saúde da API.

### Fora do escopo

- Armazenamento externo, em nuvem, banco de dados ou serviços de terceiros.
- Persistência dos metadados após o reinício do processo.
- Versionamento, edição ou exclusão de documentos.
- Autenticação e autorização completas.
- Compartilhamento entre usuários.
- Paginação, busca avançada ou ordenação configurável.
- Allowlist obrigatória de tipos MIME nesta primeira versão.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um documento por `POST /upload`, usando `multipart/form-data` e o campo `file`. |
| RF-02 | O sistema deve rejeitar o upload quando nenhum arquivo for enviado. |
| RF-03 | O sistema deve rejeitar arquivos que excedam o limite definido por `MAX_FILE_SIZE_BYTES`. |
| RF-04 | O sistema deve gerar um identificador único para cada documento aceito. |
| RF-05 | O sistema deve gravar o conteúdo do arquivo em `backend/storage`, usando `multer` com `diskStorage`. |
| RF-06 | O sistema deve registrar os metadados do documento em memória após o upload concluído. |
| RF-07 | O sistema deve associar o documento ao proprietário definido por `DMS_DEFAULT_OWNER`. |
| RF-08 | O sistema deve retornar os metadados do documento criado após um upload bem-sucedido. |
| RF-09 | O sistema deve listar os documentos registrados em memória por meio de `GET /documents`. |
| RF-10 | O sistema deve permitir o download do arquivo por meio de `GET /documents/:id/download`. |
| RF-11 | O sistema deve retornar erro identificável quando o documento solicitado não existir nos metadados. |
| RF-12 | O sistema deve retornar respostas de erro em JSON no formato `{ "error": "...", "code": "..." }`. |
| RF-13 | O sistema deve disponibilizar `GET /health`, retornando `{ "status": "ok" }` quando a aplicação estiver disponível. |
| RF-14 | A interface deve atualizar a listagem após um upload bem-sucedido. |
| RF-15 | A interface deve informar estados de carregamento, sucesso e erro sem expor caminhos físicos do servidor. |

### Regras funcionais

- O nome original deve ser preservado apenas nos metadados; o nome físico do arquivo deve ser gerado pelo sistema para evitar colisões e manipulação de caminhos.
- O caminho físico armazenado pelo repositório não deve ser retornado ao cliente.
- O valor de `owner` deve ser resolvido no servidor a partir de `DMS_DEFAULT_OWNER`. Na ausência da variável, deve ser usado um valor explícito e documentado para desenvolvimento local, como `local-user`.
- A listagem deve retornar apenas os documentos conhecidos pela instância atual do processo.
- Um identificador desconhecido deve produzir `404` sem tentar acessar um caminho derivado diretamente da entrada do cliente.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e CommonJS, sem TypeScript nesta fase. |
| RNF-02 | O frontend deve usar React com Vite e módulos ESM. |
| RNF-03 | O backend deve seguir o fluxo de dependências `routes -> controllers -> services -> repositories`. |
| RNF-04 | Os arquivos devem ser gravados exclusivamente no filesystem local, em `backend/storage`, por meio de `multer.diskStorage`. |
| RNF-05 | Os metadados devem permanecer em memória e não devem depender de banco de dados. |
| RNF-06 | O limite de upload deve ser configurável por `MAX_FILE_SIZE_BYTES`, com valor padrão seguro definido pela aplicação. |
| RNF-07 | A porta do servidor deve ser configurável por `PORT`, com valor padrão `3000`. |
| RNF-08 | A comunicação do frontend com o backend deve usar `fetch` e o prefixo `/api`, aproveitando o proxy do Vite. |
| RNF-09 | O sistema deve tratar erros nas bordas HTTP, de leitura/escrita do filesystem e de validação de entrada. |
| RNF-10 | O sistema não deve depender de provedores externos de armazenamento ou upload. |
| RNF-11 | As operações comuns devem ter funções pequenas, nomes descritivos e responsabilidades únicas. |
| RNF-12 | Os testes do backend devem usar o runner nativo `node:test`. |

## 5. Modelo de dados

### 5.1 Metadados do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único e não previsível usado nas rotas públicas. |
| `originalName` | string | Sim | Nome original enviado pelo cliente, usado para exibição e sugestão de download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. Deve ser maior que zero para uploads válidos. |
| `uploadedAt` | string | Sim | Data e hora do upload em formato ISO 8601 UTC. |
| `owner` | string | Sim | Identificador do usuário proprietário, resolvido por `DMS_DEFAULT_OWNER`. |

O repositório pode manter internamente o caminho físico necessário para o download, mas esse campo não faz parte do contrato público de metadados. O registro interno deve permitir localizar o arquivo sem reconstruir caminhos a partir de dados não confiáveis.

### 5.2 Regras do modelo

- `id` deve ser gerado no servidor, preferencialmente com UUID ou mecanismo equivalente disponível na plataforma.
- O identificador deve ser único durante a vida do processo e não deve ser derivado do nome original.
- `uploadedAt` deve ser gerado no servidor no momento da confirmação do upload.
- `size` deve corresponder ao tamanho efetivamente gravado.
- O nome original deve ser tratado como dado não confiável e nunca deve definir diretamente o caminho de armazenamento.
- Os metadados são voláteis: reiniciar o processo remove os registros, mesmo que arquivos antigos permaneçam no diretório local.
- A especificação não define limpeza automática de arquivos órfãos; essa decisão deve ser tratada em evolução posterior.

## 6. Contratos de API

### 6.1 Convenções gerais

- Prefixo do backend: as rotas são definidas sem prefixo; o frontend acessa as mesmas rotas por `/api` através do proxy do Vite.
- JSON: respostas JSON devem usar `Content-Type: application/json`.
- Erros: `{ "error": "mensagem legível", "code": "CODIGO_ESTAVEL" }`.
- O servidor não deve retornar stack trace, caminho absoluto ou detalhes internos em respostas de produção.

### 6.2 `GET /health`

Verifica se a aplicação está disponível.

**Resposta de sucesso: `200 OK`**

```json
{
	"status": "ok"
}
```

### 6.3 `POST /upload`

Cria um novo documento.

**Entrada**

- Content type: `multipart/form-data`.
- Campo obrigatório: `file`.
- O tamanho máximo é definido por `MAX_FILE_SIZE_BYTES`.
- Não é obrigatória uma allowlist de MIME nesta fase.

**Resposta de sucesso: `201 Created`**

```json
{
	"id": "8f0c2e3d-2bf5-4d6e-9b5e-9d2c7f6b6d11",
	"originalName": "contrato.pdf",
	"size": 24576,
	"uploadedAt": "2026-09-23T12:00:00.000Z",
	"owner": "local-user"
}
```

**Erros esperados**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | O campo `file` não foi enviado. |
| `413` | `FILE_TOO_LARGE` | O arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `400` | `INVALID_UPLOAD` | A entrada multipart não pôde ser processada. |
| `500` | `STORAGE_ERROR` | Falha ao gravar o arquivo ou registrar seus metadados. |

### 6.4 `GET /documents`

Lista os documentos conhecidos pela instância atual.

**Resposta de sucesso: `200 OK`**

```json
[
	{
		"id": "8f0c2e3d-2bf5-4d6e-9b5e-9d2c7f6b6d11",
		"originalName": "contrato.pdf",
		"size": 24576,
		"uploadedAt": "2026-09-23T12:00:00.000Z",
		"owner": "local-user"
	}
]
```

Quando não houver documentos, a resposta deve ser um array vazio (`[]`), e não um erro.

### 6.5 `GET /documents/:id/download`

Retorna o conteúdo binário do documento identificado por `id`.

**Resposta de sucesso: `200 OK`**

- Corpo: conteúdo binário do arquivo.
- `Content-Type`: tipo detectado ou `application/octet-stream` como fallback.
- `Content-Disposition`: deve sugerir o `originalName` ao cliente, com tratamento seguro do nome.

**Erros esperados**

| Status | Código | Situação |
| --- | --- | --- |
| `404` | `DOCUMENT_NOT_FOUND` | Não há metadados para o identificador informado. |
| `404` | `FILE_NOT_FOUND` | O metadado existe, mas o arquivo não está no filesystem. |
| `500` | `DOWNLOAD_ERROR` | Falha inesperada ao ler ou transmitir o arquivo. |

## 7. Decisões arquiteturais

### 7.1 Backend

O backend deve manter a separação simples de responsabilidades:

- `routes/`: registra métodos, caminhos, middleware do upload e delega aos controllers.
- `controllers/`: lê parâmetros, arquivos e configuração de entrada HTTP; chama os serviços e converte resultados em status e respostas HTTP.
- `services/`: implementa regras de negócio, como criação de metadados, resolução do proprietário e validação do fluxo de upload/download.
- `repositories/`: abstrai a gravação/leitura dos arquivos locais e a coleção em memória dos metadados.

As camadas internas não devem conhecer detalhes de Express. O fluxo de dependências deve permanecer `routes -> controllers -> services -> repositories`.

### 7.2 Armazenamento local

- O middleware do upload deve usar `multer` com `diskStorage`.
- O destino deve ser `backend/storage`, criado ou validado na inicialização conforme necessário.
- O nome físico deve ser seguro e independente do nome enviado pelo cliente.
- O repositório de metadados deve ser uma abstração em memória, substituível futuramente sem alterar controllers ou rotas.
- Nenhum caminho de filesystem deve ser incluído nas respostas públicas.

### 7.3 Frontend

- Componentes funcionais e React Hooks devem organizar a interface.
- A comunicação deve ficar em serviços que usam `fetch`.
- A estrutura deve separar componentes reutilizáveis, páginas e serviços.
- O proxy do Vite deve encaminhar `/api` ao backend local, removendo o prefixo antes da requisição.
- A interface deve apresentar lista, formulário de upload, ação de download e mensagens de erro sem duplicar lógica de acesso à API.

### 7.4 Configuração

Variáveis previstas:

| Variável | Uso | Padrão |
| --- | --- | --- |
| `PORT` | Porta HTTP do backend. | `3000` |
| `MAX_FILE_SIZE_BYTES` | Tamanho máximo de cada upload. | Valor padrão seguro documentado na implementação. |
| `DMS_DEFAULT_OWNER` | Identificador do usuário proprietário nesta fase sem autenticação. | `local-user` para desenvolvimento local. |

## 8. Plano de execução

As etapas abaixo descrevem a ordem de implementação futura. A criação desta especificação não executa nenhuma delas.

1. **Fundação e configuração**: confirmar scripts existentes, ler `PORT`, `MAX_FILE_SIZE_BYTES` e `DMS_DEFAULT_OWNER`, garantir a existência de `backend/storage` e manter `/health` funcionando.
2. **Repositórios**: implementar o repositório de arquivos locais com `multer.diskStorage` e o repositório de metadados em memória, incluindo contratos pequenos para salvar, buscar e listar.
3. **Serviços de negócio**: implementar upload, listagem e download; gerar identificadores, timestamps, proprietário e metadados sem expor caminhos físicos.
4. **Controllers e rotas**: registrar `POST /upload`, `GET /documents` e `GET /documents/:id/download`; conectar o middleware multipart e converter erros conhecidos em status HTTP e códigos estáveis.
5. **Tratamento de erros**: cobrir arquivo ausente, limite excedido, documento inexistente, arquivo ausente no filesystem e falhas de leitura/escrita, evitando vazamento de detalhes internos.
6. **Testes do backend**: adicionar testes com `node:test` para health check, upload válido, upload sem arquivo, limite de tamanho, listagem vazia e populada, download válido e identificador inexistente.
7. **Estrutura do frontend**: criar página e componentes para upload, lista de documentos, estados de carregamento/erro/sucesso e ação de download.
8. **Serviço de API do frontend**: encapsular chamadas `fetch` para os endpoints, processar respostas JSON e transformar falhas HTTP em mensagens apresentáveis.
9. **Integração via `/api`**: validar o proxy do Vite, o envio multipart sem definir manualmente um boundary de `Content-Type` e o download com o nome sugerido pelo backend.
10. **Validação final**: executar testes do backend, build do frontend e uma verificação manual do fluxo completo com o backend e o Vite em execução; confirmar que nenhum arquivo externo ou persistência não especificada foi introduzido.

## 9. Critérios de aceite

- O documento cobre todas as seções do modelo original.
- Um arquivo válido pode ser enviado e aparece na listagem com os cinco campos públicos definidos.
- O arquivo enviado é salvo localmente em `backend/storage` e pode ser baixado pelo `id`.
- Upload sem arquivo e upload acima do limite retornam JSON de erro com status apropriado.
- Download de identificador inexistente retorna `404` sem acessar caminho arbitrário.
- O frontend usa `/api` e apresenta estados de carregamento, sucesso e erro.
- Metadados não sobrevivem ao reinício do processo, conforme a restrição desta fase.
- Não são usados banco de dados, armazenamento externo, autenticação ou versionamento.
