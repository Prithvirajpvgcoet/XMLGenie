# XMLGenie Architecture

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0 |
| Database | PostgreSQL 15 + pgvector |
| Agent | LangGraph (ReAct), Gemini/Claude |
| Auth | JWT + bcrypt |

## Flow
1. Upload XML → lxml parse → subtree chunking → embed → store in pgvector
2. User asks question → Agent plans → calls tools (vector_search, run_xpath, parse_node, diff_files, summarize) → cited answer
3. Agent trace streams to UI in real-time

## Agent Tools
| Tool | Type |
|------|------|
| vector_search | Semantic |
| run_xpath | Deterministic |
| parse_node | Deterministic |
| diff_files | Deterministic |
| summarize | Generative |