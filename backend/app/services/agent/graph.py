from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from app.services.agent.state import AgentState
from app.services.agent.tools import search_xml_document, compare_xml_documents
from app.core.config import settings

# Initialize LLM - Standard conversational parameters
llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.2, # slight creativity for conversational flow, but low enough to avoid hallucinations
)

# Bind tools
tools = [search_xml_document, compare_xml_documents]
llm_with_tools = llm.bind_tools(tools)

# Define nodes
async def agent_node(state: AgentState):
    doc_id = state["document_id"]

    system = SystemMessage(content=f"""You are XMLGenie, an expert, conversational AI assistant for analyzing XML documents. 
The current document_id is {doc_id}.

You have TWO tools available:
1. search_xml_document(document_id, query) — Use this to search inside the document.
2. compare_xml_documents(doc_id_a, doc_id_b) — Use this to compare two documents.

CRITICAL INSTRUCTIONS TO AVOID HALLUCINATIONS:
- ALWAYS call search_xml_document before answering any question. Do not guess.
- DO NOT perform manual math or sum up order totals. If asked for a total, search for a "Metadata" or "Total" node.
- Chunks include an [ATTRIBUTE SUMMARY] section. Make sure to read it! Attributes like tracking="...", discount="...", total="..." contain the key data.
- If information is completely missing, gracefully inform the user that it is not available in the document. Do not invent answers.
- Provide your final answers in neat, grammatical, and conversational language. 
- Always end your response by politely citing the XPath location of the data you found.""")

    messages = [system] + list(state["messages"])
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}

# Build Graph
builder = StateGraph(AgentState)
builder.add_node("agent", agent_node)
builder.add_node("tools", ToolNode(tools))

builder.set_entry_point("agent")
builder.add_conditional_edges("agent", tools_condition)
builder.add_edge("tools", "agent")

# Compile graph
graph = builder.compile()
