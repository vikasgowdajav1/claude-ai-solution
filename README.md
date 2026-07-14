# Knowledge Hub — AI-Powered Wiki & RAG Platform

Full-stack knowledge management system with RAG (Retrieval-Augmented Generation), AI agent pipelines, PDF knowledge base, and human-in-the-loop approval workflows.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Express 5 + Mongoose
- **Database:** MongoDB
- **AI/LLM:** Ollama (local) with Gemini cloud fallback
- **Embeddings:** nomic-embed-text via Ollama
- **Search:** DuckDuckGo API + RSS feeds
- **Workspaces:** npm workspaces

## Project Structure

```text
client/                     # React frontend
  src/
    pages/
      AskAIPage.js          # RAG-powered Q&A chat
      KnowledgeBasePage.js   # PDF upload & document management
      AgentWorkflowPage.js   # Researcher → Analyst → Publisher pipeline
      ApprovalsPage.js       # Human-in-the-loop review queue
      HomePage.js            # Dashboard
      WikiEditorPage.js      # Wiki page editor
      SearchPage.js          # Full-text search
server/                     # Express backend
  src/
    services/
      embeddingService.js    # Text chunking + Ollama embeddings
      vectorStoreService.js  # Cosine similarity search on MongoDB vectors
      documentService.js     # PDF processing & knowledge base
      searchService.js       # DuckDuckGo + RSS feed aggregation
      agentService.js        # AI agent pipeline orchestration
    models/
      Document.js            # Uploaded docs with embedded chunks
      ApprovalRequest.js     # Approval workflow
      ResearchTask.js        # Agent pipeline tasks
      WikiPage.js            # Wiki pages
    controllers/
      ragController.js       # RAG Q&A endpoints
      documentController.js  # Document upload/management
      agentController.js     # Agent pipeline endpoints
      approvalController.js  # Approval workflow endpoints
    routes/
      rag.js                 # /api/rag/*
      documents.js           # /api/documents/*
      agents.js              # /api/agents/*
      approvals.js           # /api/approvals/*
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Ollama** installed and running ([ollama.com](https://ollama.com))

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Pull Ollama models

```bash
# Chat/generation model
ollama pull llama3.2

# Embedding model (required for RAG)
ollama pull nomic-embed-text
```

### 3. Configure environment

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Edit `server/.env` with your values:

```env
MONGODB_URI=mongodb://localhost:27017/wiki-manager
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
EMBEDDING_MODEL=nomic-embed-text
JWT_SECRET=your-secret-key

# Optional
GEMINI_API_KEY=your-gemini-key       # Cloud LLM fallback
RSS_FEEDS=https://hnrss.org/newest   # Comma-separated RSS feed URLs
```

### 4. Start the application

```bash
# Start both frontend and backend
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

### 5. Verify Ollama is running

```bash
ollama list
```

You should see both `llama3.2` and `nomic-embed-text` in the list.

## Features

### RAG-Powered Ask AI (`/ask`)
- Toggle between **RAG mode** (vector search across documents + wiki) and basic wiki text search
- Shows similarity scores and source types (document vs wiki)
- Supports model selection from available Ollama models

### Knowledge Base (`/knowledge-base`)
- **Drag & drop** PDF, TXT, MD, CSV files
- Automatic text extraction → chunking (~500 word chunks with overlap) → embedding generation
- Stats dashboard: total documents, embedded count, total chunks
- Re-embed and reprocess documents on demand
- Categorize documents: infrastructure, security, deployment, runbook, etc.

### AI Agent Pipeline (`/agents`)
Three-stage pipeline with configurable data sources:

| Stage | Agent | What it does |
|-------|-------|-------------|
| 1 | **Researcher** | Gathers data from Knowledge Base (vector search), DuckDuckGo, and RSS feeds |
| 2 | **Analyst** | Identifies critical updates, dependency conflicts, risks with severity levels (🔴🟡🟢) |
| 3 | **Publisher** | Produces polished Markdown report with executive summary and action items |

Toggle sources per research task:
- ✅ Web Search (DuckDuckGo)
- ✅ RSS Feeds
- ✅ Knowledge Base
- ✅ Require Approval

### Human-in-the-Loop Approvals (`/approvals`)
- AI agent outputs go through an approval queue before being published
- Priority levels: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low
- Approve or reject with review notes
- Auto-updates linked research task status

### How the RAG Pipeline Works

```
PDF Upload → Text Extraction → Chunking (500 words, 50 word overlap)
                                    ↓
                        Ollama nomic-embed-text
                                    ↓
                    Embedding vectors stored in MongoDB
                                    ↓
User Question → Generate query embedding → Cosine similarity search
                                    ↓
                    Top-K chunks + wiki results → LLM context
                                    ↓
                        Ollama llama3.2 generates answer
```

## API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### RAG
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rag/ask` | RAG-powered Q&A (vector search + LLM) |
| POST | `/api/rag/search` | Vector similarity search without LLM |

### Documents (Knowledge Base)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |
| GET | `/api/documents/stats` | Knowledge base stats |
| POST | `/api/documents/upload` | Upload PDF/TXT/MD/CSV |
| POST | `/api/documents/reembed` | Re-embed all unembedded docs |
| POST | `/api/documents/:id/reprocess` | Reprocess a document |
| DELETE | `/api/documents/:id` | Soft-delete a document |

### AI Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/research` | Start Researcher→Analyst→Publisher pipeline |
| GET | `/api/agents/tasks` | List research tasks |
| GET | `/api/agents/tasks/:id` | Get task with pipeline status |
| POST | `/api/agents/search/external` | Quick DuckDuckGo + RSS search |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approvals` | List approval requests |
| GET | `/api/approvals/pending/count` | Pending approval count |
| PATCH | `/api/approvals/:id/review` | Approve or reject |

### Wiki & Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/wiki` | List wiki pages |
| POST | `/api/ai/ask` | Basic wiki Q&A (non-RAG) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run client` | Start Vite frontend only |
| `npm run server` | Start Express backend only |
| `npm run build` | Build frontend for production |
| `npm run check` | Syntax check + build validation |

## Notes

- The backend starts even if MongoDB is not reachable; the health endpoint reports disconnected status.
- If Ollama is not running, the system falls back to Gemini (if `GEMINI_API_KEY` is set).
- Uploaded documents are stored in `server/uploads/` (gitignored).
- Embedding vectors are stored directly in MongoDB document chunks — no separate vector DB required.
- The agent pipeline runs asynchronously; poll `/api/agents/tasks/:id` or use the UI's auto-refresh.
