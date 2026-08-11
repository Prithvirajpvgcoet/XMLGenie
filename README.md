XMLGenie

XMLGenie

Chat with your XML files. Get grounded answers, not guesses.

An agentic RAG platform that turns raw XML — invoices, catalogs, configs, logs — into a conversational interface, with every answer traceable back to the exact node it came from.
Upload an XML file — an invoice, a product catalog, a config, an API log — and ask questions in plain English. XMLGenie doesn't just search and summarize; it runs a tool-calling agent that plans multi-step retrieval, cites the exact XML node an answer came from, and can compare two file versions and explain what changed.

The Problem

XML files hold a lot of important business data — but they're unreadable to anyone who isn't a developer. Today, if someone needs an answer buried in an XML file, they either wait on an engineer to write a script, or scroll through hundreds of nested tags by hand.

XMLGenie turns that into: upload the file, ask your question, get a trustworthy answer in seconds — with proof of exactly where it came from.

What XMLGenie Does
1. UPLOAD   → User uploads any XML file
              The app parses it and builds a searchable index automatically

2. ASK      → User types a plain-English question
              Example: "Which orders shipped late in March?"

3. AGENT    → An agent plans a retrieval strategy, calls the right tools,
              and returns:
              • A grounded answer
              • Citations linking back to the exact XML node(s)
              • A live "reasoning trace" of every step it took

4. COMPARE  → User uploads a second version of a file and asks
              "what changed?" — a structural diff tool powers the answer

Demo
You:      Which orders shipped late in March?

XMLGenie: 3 orders shipped after their promised date in March:
          Order #4521 (4 days late) · Order #4598 (1 day late) · Order #4612 (2 days late)
          All three were flagged with carrier delays in the shipping notes.

          [Order#4521]  [Order#4598]  [Order#4612]   ← click to jump to the source node
          
Key Features
Agentic, not a wrapper — a LangGraph tool-calling agent plans, acts, and observes across multiple steps instead of a single prompt-in/answer-out call.
Structure-aware chunking — XML is split by subtree (not fixed character windows), preserving tag hierarchy and attributes as retrieval metadata.
Hybrid retrieval — combines exact XPath/attribute lookups with pgvector semantic search, merged and re-ranked before reaching the agent.
Node-level citations — every answer links back to the exact <Order id="...">-level source, clickable in a live XML tree explorer.
Structural diff tool — compare two XML versions and get a plain-English summary of what was added, removed, or changed.
Live agent trace — a UI panel that streams each tool call the agent makes in real time, like a visible scratchpad.
Evaluation harness — a hand-labeled Q&A set used to score answer groundedness and citation accuracy.
Architecture
Data Layer
FastAPI
React + TypeScript
HTTP / WS
Upload · Tree Explorer · Chat· Diff Viewer
REST + WebSocket API
Parser & Structure-AwareChunker
LangGraph AgentOrchestrator
Tools: vector_search,run_xpath, diff_files,summarize
PostgreSQL + pgvector
Gemini / Claude API
Tech Stack
Layer	Technology
Frontend	React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query
Backend	Python 3.11+, FastAPI, WebSockets
Database	PostgreSQL 15 + pgvector
ORM / Migrations	SQLAlchemy 2.0, Alembic
Auth	JWT (python-jose), bcrypt
XML Parsing	lxml, xmltodict
Agent Framework	LangGraph / LangChain
LLM & Embeddings	Google Gemini API (pluggable)
Background Jobs	Celery + Redis
Testing	pytest, Vitest, React Testing Library
Deployment	Docker, Render (backend), Vercel (frontend)
Project Structure
text
xmlgenie/
├── backend/
│   └── app/
│       ├── api/           # upload, documents, chat, diff, auth routes
│       ├── models/        # SQLAlchemy models
│       ├── services/
│       │   ├── xml_parser.py
│       │   ├── chunker.py
│       │   ├── retriever.py
│       │   ├── differ.py
│       │   └── agent/     # orchestrator, tools, prompts
│       └── main.py
├── frontend/
│   └── src/
│       ├── pages/          # Landing, Login, Workspace, Chat, Diff
│       └── components/     # UploadDropzone, XmlTreeExplorer, ChatBubble,
│                            # AgentTracePanel, CitationChip, DiffViewer
├── sample_data/             # sample XML files for testing/demo
├── docs/                     # architecture notes, design decisions
└── docker-compose.yml
Getting Started
Prerequisites
Python 3.11+
Node.js 18+
Docker & Docker Compose
A Gemini (or other LLM provider) API key
Installation
bash
# 1. Clone the repo
git clone https://github.com/<your-username>/xmlgenie.git
cd xmlgenie

# 2. Start Postgres (with pgvector) and Redis
docker-compose up -d

# 3. Backend setup
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, LLM_API_KEY, etc.
alembic upgrade head
uvicorn app.main:app --reload

# 4. Frontend setup (in a new terminal)
cd frontend
npm install
cp .env.example .env        # set VITE_API_BASE_URL
npm run dev

Visit http://localhost:5173, sign up, and upload a file from sample_data/ to try it out.

Environment Variables

Backend (backend/.env)

Variable	Description
DATABASE_URL	PostgreSQL connection string
REDIS_URL	Redis connection string (background jobs)
SECRET_KEY	JWT signing secret
LLM_API_KEY	Gemini / Claude API key
LLM_PROVIDER	gemini or claude

Frontend (frontend/.env)

Variable	Description
VITE_API_BASE_URL	Backend API base URL
API Reference
Method	Endpoint	Description
POST	/api/auth/signup	Register a new user
POST	/api/auth/login	Authenticate, returns JWT
POST	/api/upload	Upload and ingest an XML file
GET	/api/documents	List uploaded documents
GET	/api/documents/{id}/tree	Get JSON tree for the explorer
POST	/api/retrieve	Debug endpoint: raw retrieval results
POST / WS	/api/chat / /ws/chat	Ask the agent a question
POST	/api/diff	Structural diff between two documents

Full interactive docs available at /docs (Swagger UI) once the backend is running.

The Agent's Tools
Tool	What It Does
vector_search	Semantic similarity search over chunk embeddings
run_xpath	Deterministic lookup by XPath/attribute
parse_node	Fetch raw XML for a specific node
diff_files	Structural comparison between two documents
summarize	Condenses retrieved chunks into a concise answer
Evaluation

A small hand-labeled Q&A set (per sample file, with known-correct XPath answers) is used to score the agent on exact-match and citation accuracy:

bash
python backend/eval/run_eval.py
Roadmap
 Support for XSD-driven auto-validation warnings in the UI
 Multi-file cross-document querying
 Export chat threads and diffs as PDF reports
 Support for additional LLM providers (OpenAI, local models via Ollama)
Screenshots



Distributed under the MIT License. See LICENSE for details.

Contact

Prithviraj Thorat GitHub · LinkedIn · prithvirajthorat0770@gmail.com
