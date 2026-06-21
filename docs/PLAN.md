# Wiki-Chat App — Konzept & Plan (TypeScript-Stack)

## 🎯 Vision

Eine schlanke, moderne Web-App, die **Wiki** und **KI-Chat** vereint.  
Dokumente importieren (PDF, Word, MD, Webseiten, YouTube) → automatisch indexieren (Vektor + Keyword) → RAG-Chat **und** automatisch generiertes, verlinktes Wiki.

**Tech-Stack**: TypeScript überall — Frontend (Vue 3) + Backend (Bun + Hono + tRPC) + Shared Types.  
**Eine Sprache. Type-safe End-to-End.**

---

## 🧠 Von WeKnora übernommene Konzepte

| Konzept               | WeKnora                                                              | Unser Ansatz                                                       |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Login & Rollen**    | JWT + Tenant-RBAC (Owner/Admin/Contributor/Viewer)                   | JWT + Rollen: Admin / Editor / Viewer                              |
| **LLM Model Mgmt**    | Viele Provider (OpenAI, DeepSeek, Anthropic, Ollama…)                | OpenAI-kompatibel + DeepSeek (Chat + Embedding)                    |
| **Vector Database**   | Multi-Engine (pgvector, ES, Milvus, Qdrant…)                         | **Nur pgvector** — reicht völlig                                   |
| **Knowledge Base**    | KB als Container + Config + Indexing Strategy                        | **Workspace** mit Indexing-Strategy                                |
| **Dokument-Import**   | PDF, Word, MD, HTML, Excel, PPT + Parser-Service                     | **PDF, .docx, MD, HTML, Bilder** via MarkItDown                    |
| **URL-Import**        | Webseite scrapen → Dokument                                          | Website scrapen → Markdown → chunken → indexieren                  |
| **YouTube-Import**    | Transkript via Apify/Supadata → LLM → Wiki                           | **YouTube oEmbed + Transcript API** → LLM → Wiki-Seite             |
| **Hybrid Retrieval**  | pgvector (cosine) + BM25-Keyword                                     | **pgvector + PostgreSQL tsvector**                                 |
| **Wiki-Generierung**  | LLM generiert Wiki-Seiten mit `[[Links]]` aus Dokumenten             | Gleiches Konzept — plus **TipTap-Editor** für manuelle Bearbeitung |
| **Wiki-Graph**        | Graph-Visualisierung der verlinkten Wiki-Seiten                      | **D3.js Force-Directed Graph**                                     |
| **Indexing Strategy** | `vector_enabled`, `keyword_enabled`, `wiki_enabled`, `graph_enabled` | **Übernommen 1:1** — geniales Konzept!                             |

---

## 🛠️ Tech-Stack

| Komponente           | Technologie                              | Begründung                                                                                                |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Backend**          | **Bun + Hono**                           | Bun: 4x schneller als Node.js, natives TypeScript, SSE perfekt. Hono: leichtgewichtig, Express-kompatibel |
| **API-Layer**        | **tRPC**                                 | Type-safe End-to-End. Backend-Funktionen = API. Kein separates API-Contract                               |
| **Frontend**         | **Vue 3 + TypeScript + Vite**            | Du kennst es bereits                                                                                      |
| **UI-Library**       | **Shadcn/vue**                           | Leicht, schön, kompatibel mit Vue 3                                                                       |
| **State**            | **Pinia**                                | Bewährt                                                                                                   |
| **ORM**              | **Drizzle**                              | Type-safe SQL, leichtgewichtiger als Prisma, näher an PostgreSQL                                          |
| **Datenbank**        | **PostgreSQL + pgvector**                | Beides in einer DB — kein zusätzlicher Service                                                            |
| **Cache**            | **Redis**                                | Sessions, Caching                                                                                         |
| **LLM Integration**  | **Vercel AI SDK** (`ai`)                 | Streaming, Tool Calling, Agents — out-of-the-box                                                          |
| **Dokument-Parsing** | **MarkItDown (Python)** als Microservice | PDF/DOCX/HTML parsen, per HTTP vom Backend aufgerufen                                                     |
| **Shared Types**     | **`packages/shared/`**                   | Types für WikiPage, Document, Chunk, ChatMessage… von Frontend + Backend genutzt                          |
| **Wiki-Editor**      | **TipTap (ProseMirror)**                 | Custom `[[slug]]`-Nodes, Auto-Completion, Markdown-Support                                                |
| **Wiki-Graph**       | **D3.js** oder **Cytoscape.js**          | Force-Directed Graph der Wiki-Verlinkungen                                                                |

---

## 🏗️ System-Architektur

```
┌──────────────────────────────────────────────────────┐
│                     Frontend                          │
│          Vue 3 + TypeScript + Vite                    │
│     (Chat-UI, Wiki-Browser, Admin-Panel)              │
└──────────────────┬───────────────────────────────────┘
                   │ tRPC (type-safe API) + SSE (Streaming)
                   │ ✅ Eine Sprache: TypeScript überall!
┌──────────────────▼───────────────────────────────────┐
│               Backend API (Bun + Hono)                │
│  Auth │ KB │ Chat │ Wiki │ Import │ Model │ Admin     │
│  LLM │ Embedding │ Pipeline                           │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│               Datenbank & Services                    │
├───────────────────────────────────────────────────────┤
│  PostgreSQL (pgvector + full-text search)             │
│  Redis (Sessions, Cache)                              │
│  Async Pipeline via Bun/Worker-Threads (kein Queue)   │
└───────────────────────────────────────────────────────┘
```

---

## 🗄️ Datenbank-Schema (PostgreSQL + pgvector)

### Kern-Tabellen

```sql
-- users
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- admin, editor, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- sessions / auth_tokens
sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- model_providers (LLM & Embedding Konfiguration)
model_providers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,           -- z.B. "openai", "deepseek"
  provider_type VARCHAR(20) NOT NULL,   -- "chat", "embedding", "both"
  api_base_url VARCHAR(512) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  default_model VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- workspaces (entspricht "knowledge_base" in WeKnora)
workspaces (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL REFERENCES users(id),
  chunk_size INT DEFAULT 512,
  chunk_overlap INT DEFAULT 50,
  embedding_model_id VARCHAR(36) REFERENCES model_providers(id),
  chat_model_id VARCHAR(36) REFERENCES model_providers(id),
  indexing_strategy JSONB NOT NULL DEFAULT '{
    "vector_enabled": true,
    "keyword_enabled": true,
    "wiki_enabled": false,
    "graph_enabled": false
  }',
  wiki_config JSONB DEFAULT '{
    "auto_ingest": false,
    "synthesis_model_id": null,
    "wiki_language": "de",
    "max_pages_per_ingest": 10
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- workspace_members (RBAC auf Workspace-Ebene)
workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id),
  user_id INT NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- admin, editor, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
)

-- documents (importierte Dokumente)
documents (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id),
  title VARCHAR(512) NOT NULL,
  type VARCHAR(50) NOT NULL,         -- "pdf", "docx", "md", "html", "youtube", "url"
  source TEXT NOT NULL,               -- Dateiname, URL, YouTube-ID
  source_url TEXT,                    -- originale URL falls vorhanden
  content TEXT,                       -- extrahierter Text (nach Parsing)
  file_path TEXT,                     -- Pfad zur hochgeladenen Datei
  file_size BIGINT,
  file_hash VARCHAR(64),
  parse_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  parse_error TEXT,
  chunk_count INT DEFAULT 0,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
)

-- chunks (mit Vektor-Embedding)
chunks (
  id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL REFERENCES documents(id),
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id),
  content TEXT NOT NULL,
  chunk_index INT NOT NULL,
  token_count INT DEFAULT 0,
  embedding vector(1536),             -- pgvector (z.B. 1536 für OpenAI/text-embedding-3-small)
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- keyword_index (Keyword-Search via PostgreSQL full-text search)
-- Nutzt tsvector direkt auf der chunks Tabelle für Hybrid Search

-- wiki_pages
wiki_pages (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id),
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(512) NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  page_type VARCHAR(20) DEFAULT 'article', -- article, entity, concept
  status VARCHAR(20) DEFAULT 'published',
  source_document_id VARCHAR(36) REFERENCES documents(id),
  out_links JSONB DEFAULT '[]',       -- ["slug1", "slug2"]
  in_links JSONB DEFAULT '[]',        -- automatisch gepflegt
  version INT DEFAULT 1,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
)

-- chat_sessions (KI-Chat Sessions)
chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id),
  user_id INT NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  model_id VARCHAR(36) REFERENCES model_providers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- chat_messages
chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL REFERENCES chat_sessions(id),
  role VARCHAR(20) NOT NULL,           -- "user", "assistant", "system"
  content TEXT NOT NULL,
  knowledge_refs JSONB DEFAULT '[]',   -- Referenzen auf verwendete Chunks
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 🔄 Datenfluss: Dokument → Wiki

```
Upload / Import (Frontend via tRPC)
        │
        ▼
Backend (Bun + Hono)
        │
        ├──► MarkItDown (Parser) → Roh-Text
        │
        ├──► Chunken (Text-Splitter)
        │       │
        │       ├──► Embedding (OpenAI/DeepSeek API) → pgvector
        │       │
        │       ├──► tsvector-Index → Keyword-Suche
        │       │
        │       └──► [wiki_enabled] → Wiki-Generierung:
        │                │
        │                ▼
        │         Vercel AI SDK: streamText()
        │         → SSE-Stream zurück zum Frontend
        │         → User sieht Wiki-Seite live wachsen
        │                │
        │                ▼
        │         [[Links]] automatisch auflösen
        │         → out_links + in_links aktualisieren
        │
        └──► Response: "Verarbeitet" + Wiki-Seiten-Links
```

### Indexing Strategy (von WeKnora übernommen)

Jeder Workspace hat eine `indexing_strategy` JSONB-Spalte:

```json
{
  "vector_enabled": true, // Chunks embedden + pgvector
  "keyword_enabled": true, // tsvector Keyword-Index
  "wiki_enabled": false, // Automatische Wiki-Generierung
  "graph_enabled": false // Knowledge Graph (optional, später)
}
```

Beim Import eines Dokuments werden **nur die aktivierten Pipelines** ausgeführt.

---

## 🎥 YouTube-Import

1. **YouTube-URL eingeben** (Frontend)
2. **Video-ID extrahieren** (Regex — gleiche Patterns wie WeKnora)
3. **oEmbed-API** für Metadaten (Titel, Channel, Thumbnail) — kein API-Key nötig
4. **youtube-transcript** npm package für Transkript
5. Transkript als Dokument speichern
6. **Vercel AI SDK `streamText()`** → generiert Wiki-Seite aus Transkript
7. **SSE-Stream** → User sieht Wiki-Seite live wachsen
8. `[[Links]]` zu verwandten Wiki-Seiten automatisch eingefügt
9. Wiki-Seite editierbar im **TipTap Editor**

---

## 📋 Feature-Liste

### MVP

- [ ] Auth (Login/Register) — JWT + bcrypt
- [ ] Admin: User verwalten, Rollen (Admin/Editor/Viewer)
- [ ] Model-Provider CRUD (OpenAI-kompatibel + DeepSeek)
- [ ] Workspace CRUD
- [ ] Dokument-Upload (PDF, MD, TXT) + MarkItDown-Parsing
- [ ] Chunking + Embedding + pgvector
- [ ] RAG Chat mit Hybrid Search (Vektor + Keyword)
- [ ] Chat-Oberfläche mit SSE-Streaming

### v1

- [ ] Wiki-Auto-Generierung (LLM → Wiki-Seite aus Dokument)
- [ ] Wiki-Browser (interlinked Markdown-Seiten)
- [ ] TipTap Wiki-Editor (mit `[[slug]]`-Auto-Completion und Live-Vorschau)
- [ ] Wiki-Volltext-Suche
- [ ] URL-Import (Webseite scrapen)
- [ ] YouTube-Import (Transkript → Wiki-Seite)
- [ ] Word (.docx) Import
- [ ] Wiki-Versionierung

### v2

- [ ] Knowledge Graph (D3.js Force-Directed)
- [ ] Batch-Dokumenten-Import
- [ ] Web-Suche Integration
- [ ] Multi-Workspace / Teams
- [ ] API-Tokens für externe Integration
- [ ] Dokumenten-Preview im Browser

---

## � Deployment (Hetzner)

Die App wird nach dem **Deployment-Standard** (`docs/deployment-standard.md`) auf einem Hetzner-Multi-App-Server deployed.

### Entwicklungs-Setup (lokal — Hybrid)

Backend + Frontend laufen **nativ** auf macOS für maximalen Hot-Reload.  
Datenbank-Services laufen in Docker.

```bash
# 1. Services starten (PostgreSQL + pgvector, Redis, Parser)
docker compose up -d db redis parser

# 2. Backend nativ (Hot-Reload in <50ms)
bun run dev

# 3. Frontend nativ (Vite HMR)
cd frontend && bun run dev
```

### Produktions-Setup (Hetzner — alles in Docker)

Nach dem Deployment-Standard:

| Service                        | Docker-Image                    | Port                            | Netzwerk                           |
| ------------------------------ | ------------------------------- | ------------------------------- | ---------------------------------- |
| **app** (`bun run start`)      | Build aus `backend/Dockerfile`  | `127.0.0.1:${WEB_PORT}:3000`    | `appnet` + `hetzner-network`       |
| **frontend** (Nginx SPA)       | Build aus `frontend/Dockerfile` | `127.0.0.1:${FRONTEND_PORT}:80` | `hetzner-network`                  |
| **db** (PostgreSQL + pgvector) | `pgvector/pgvector:pg17`        | —                               | `appnet` (Alias: `wikichat-db`)    |
| **redis**                      | `redis:7-alpine`                | —                               | `appnet` (Alias: `wikichat-redis`) |
| **parser** (MarkItDown)        | Build aus `parser/Dockerfile`   | —                               | `appnet`                           |

### docker-compose.yml

```yaml
services:
  app:
    build: ./backend
    ports:
      - "127.0.0.1:${WEB_PORT}:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - appnet
      - hetzner-network

  frontend:
    build: ./frontend
    ports:
      - "127.0.0.1:${FRONTEND_PORT}:80"
    restart: unless-stopped
    networks:
      - hetzner-network

  db:
    image: pgvector/pgvector:pg17
    volumes:
      - data:/var/lib/postgresql/data
    env_file: .env
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-wikichat}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      appnet:
        aliases:
          - wikichat-db

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    restart: unless-stopped
    networks:
      appnet:
        aliases:
          - wikichat-redis

  parser:
    build: ./parser
    env_file: .env
    restart: unless-stopped
    networks:
      - appnet

volumes:
  data:
  redis-data:

networks:
  appnet:
  hetzner-network:
    external: true
```

### .env-Standard (nach Deployment-Standard)

```env
# === Deployment (Pflicht) ===
APP_SLUG=wikichat
WEB_PORT=3083
FRONTEND_PORT=3084

# === Datenbank ===
DB_USER=wikichat
DB_PASSWORD=<generiert>
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@wikichat-db:5432/wikichat

# === Redis ===
REDIS_URL=redis://wikichat-redis:6379

# === App ===
JWT_SECRET=<generiert>
PARSER_URL=http://parser:8000/parse
```

### Nginx (auf dem Hetzner-Host)

```nginx
# /etc/nginx/sites-available/wikichat.conf

# Frontend
server {
    server_name wikichat.elmarhepp.de;
    listen 443 ssl;
    # ... SSL-Konfiguration ...
    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # SSE-Support für Chat-Streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}

# API (inkl. SSE-Streaming)
server {
    server_name wikichat-api.elmarhepp.de;
    listen 443 ssl;
    # ... SSL-Konfiguration ...
    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Kein Buffering für SSE-Streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

### Deploy-Script

```bash
#!/bin/bash
# deploy.sh — nach dem Standard-Pattern von mediathek
rsync -avz --delete \
  --exclude .env \
  --exclude node_modules \
  --exclude .git \
  ./ $HOST:/var/www/wikichat/
ssh $HOST "cd /var/www/wikichat && docker compose up -d --build"
```

---

## 📁 Projekt-Struktur

```
wiki-chat/
├── packages/
│   └── shared/                    # 🔥 Shared TypeScript Types
│       ├── src/types/
│       │   ├── user.ts            # User, Session, Role
│       │   ├── workspace.ts       # Workspace, WorkspaceMember
│       │   ├── document.ts        # Document, ParseStatus
│       │   ├── chunk.ts           # Chunk, Embedding
│       │   ├── wiki.ts            # WikiPage, WikiLink, WikiGraphData
│       │   ├── chat.ts            # ChatSession, ChatMessage, KnowledgeRef
│       │   ├── model.ts           # ModelProvider
│       │   └── indexing.ts        # IndexingStrategy, WikiConfig
│       └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts               # Bun + Hono Server Bootstrap
│   │   ├── router/                # tRPC Router (auth, user, workspace, document, wiki, chat, model, search)
│   │   ├── service/               # Business Logic (pipeline, wiki-generator, youtube, search, llm)
│   │   ├── repository/            # Drizzle Queries
│   │   ├── db/                    # Drizzle Schema + Migrations + Seed
│   │   └── middleware/            # JWT Auth + RBAC
│   ├── Dockerfile                 # Bun → Production
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── chat/              # Chat mit SSE-Streaming
│   │   │   ├── wiki/              # Wiki-Browser + Editor + Graph
│   │   │   ├── workspace/         # Workspace-Verwaltung
│   │   │   ├── documents/         # Upload + Liste
│   │   │   └── admin/             # User, Models, Einstellungen
│   │   ├── stores/                # Pinia
│   │   ├── components/editor/     # TipTap Wiki-Editor mit [[Links]]-Support
│   │   ├── components/wiki-graph/ # D3.js Force-Directed Graph
│   │   └── router/
│   ├── Dockerfile                 # Multi-Stage: Vite Build → Nginx
│   └── package.json
├── parser/                        # Python Microservice (MarkItDown)
│   ├── main.py                    # HTTP API für PDF/DOCX/MD/HTML-Parsing
│   ├── Dockerfile                 # python:3.12-slim
│   └── requirements.txt
├── docker-compose.yml             # Prod: App + Frontend + DB + Redis + Parser
├── docker-compose.dev.yml         # Dev: Nur DB + Redis + Parser (Backend/Frontend nativ)
├── .env.example
├── deploy.sh
├── Makefile
└── README.md
```

---

## 🔍 Warum TypeScript (Bun + Hono + tRPC) ideal ist

| Anforderung                 | TypeScript (Bun + Hono)                                                           |
| --------------------------- | --------------------------------------------------------------------------------- |
| **Chat-Streaming**          | `streamText()` (Vercel AI SDK) → SSE → Frontend. Tokens live, 5 Zeilen Code       |
| **Wiki-Generierung live**   | User sieht Seite wachsen während LLM arbeitet. SSE-Stream                         |
| **`[[slug]]`-AutoComplete** | tRPC-Aufruf beim Tippen → `suggestSlugs(query)` → Dropdown. Kein API-Contract     |
| **Type Safety E2E**         | `WikiPage` in `packages/shared/` geändert → Compiler zeigt Frontend + Backend     |
| **Async Pipeline**          | `await Promise.all([embed(chunks), generateWiki(chunks)])` — parallel, kein Queue |
| **Admin**                   | Vue 3 (kennst du) — Admin-Komponenten in derselben Sprache wie Frontend           |
| **Eine Sprache**            | TypeScript in Frontend + Backend + Shared. Null Kontextwechsel                    |

---

## 🔍 Analyse: Was macht WeKnora "hervorragend und sofort funktionierend"?

Nach intensiver Analyse des WeKnora-Codes:

1. **Indexing Strategy als JSONB** — genial einfach. Man schaltet einfach `wiki_enabled: true` und schon wird jedes neu importierte Dokument automatisch zu einer Wiki-Seite. Kein zusätzlicher Config-Aufwand.

2. **Wiki-Prompt-Engineering** — Die Prompts in `prompts_wiki.go` und `prompts_youtube.go` sind extrem detailliert und erzeugen hochwertige Ergebnisse. Der Key: dem LLM werden sowohl Rohdokument als auch bereits existierende Wiki-Seiten (als `available_wiki_pages`) übergeben, sodass automatisch Querverweise (`[[slug|display name]]`) entstehen.

3. **Async Pipeline in einer Sprache** — In WeKnora asynq (Go-Queue), bei uns: `Promise.all()` + Worker-Threads. Kein Queue-Overhead, keine Serialisierung.

4. **Hybrid Search (pgvector + tsvector)** — PostgreSQL kann beides: Vektor-Suche (pgvector) und Keyword-Suche (tsvector). Kein separater Such-Service nötig.

5. **Wiki mit Slug-Konzept** — Seiten haben sprechende Slugs (`entity/zhong-guo`, `concept/retrieval-augmented-generation`) statt kryptischer IDs.

6. **Wiki-Link-Auflösung** — Ausgehende (`out_links`) und eingehende (`in_links`) Links werden als JSONB-Array gespeichert und beim Generieren/Editieren aktualisiert.

7. **YouTube-oEmbed-Fallback** — Wenn der konfigurierte Provider nicht erreichbar ist, fällt WeKnora auf die YouTube-oEmbed-API zurück (die ohne API-Key funktioniert).

---

## 🚀 Nächste Schritte (10 Phasen)

1. **Projekt-Setup**: Monorepo (Bun + Hono + Vue + Drizzle) + `docker-compose.yml` + `docker-compose.dev.yml` nach Hetzner-Standard
2. **Datenbank**: PostgreSQL + pgvector + Drizzle Schema + Migrationen
3. **Auth**: JWT-Login/Register + Middleware
4. **Admin**: User- und Model-Verwaltung (Vue-Komponenten)
5. **Workspaces**: CRUD + Mitglieder + Indexing Strategy
6. **Dokument-Import**: Upload + MarkItDown + Chunking
7. **Embedding + Hybrid Index**: pgvector + tsvector
8. **Chat**: RAG-Chat mit Vercel AI SDK + SSE
9. **Wiki**: Auto-Generierung + TipTap-Editor + Browser
10. **YouTube-Import**: Transkript → Wiki-Seite

---

### Entwicklungskurzreferenz

```bash
# Täglicher Dev-Workflow
docker compose -f docker-compose.dev.yml up -d   # DB + Redis + Parser
bun run dev                                       # Backend (Port 3000, Hot-Reload)
cd frontend && bun run dev                        # Frontend (Port 5173, Vite HMR)

# Deployment
./deploy.sh                                       # rsync + docker compose up --build
```
