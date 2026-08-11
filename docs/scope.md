# XMLGenie Scope

## What It Is
Agentic RAG copilot for XML files. Upload XML → structure-aware chunking → vector+XPath hybrid retrieval → multi-step agent answers with citations.

## In Scope
- JWT auth, XML upload, structure-aware chunking
- Hybrid retrieval (vector + XPath), LangGraph agent with 5 tools
- Agent trace panel, node-level citations, XML diff
- React+TypeScript frontend

## Out of Scope
- Non-XML formats, multi-tenant, XSLT, mobile app, fine-tuning


## Success Criteria
1. A user can upload any well-formed XML file and ask natural-language questions about it
2. The agent's answers cite the exact XPath / XML node they came from
3. The agent trace panel shows the multi-step reasoning process
4. Two XML files can be compared with a structural diff
5. The evaluation harness demonstrates measurable groundedness scores
6. The system is deployed and accessible via public URLs