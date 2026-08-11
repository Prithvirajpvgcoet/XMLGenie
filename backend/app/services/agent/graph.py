from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from app.services.agent.state import AgentState
from app.services.agent.tools import search_xml_document, compare_xml_documents
from app.core.config import settings

# Initialize LLM
llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY
)

# Bind tools
tools = [search_xml_document, compare_xml_documents]
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are XMLGenie, an expert AI assistant for analyzing XML documents.
You have ONLY ONE tool available: search_xml_document.
ALWAYS use this tool to search the XML document before answering any question.
Never call any other tool. Never hallucinate tool names.
When you have the search results, summarize the answer clearly for the user.
Always cite the XPath location of the data you found."""

# Define nodes
async def agent_node(state: AgentState):
    doc_id = state["document_id"]
    system = SystemMessage(content=f"""You are XMLGenie, an expert AI assistant for analyzing and comparing XML documents.
You have TWO tools available:
1. search_xml_document — search inside a single XML document
2. compare_xml_documents — compare two XML documents and find differences

The current document has document_id = {doc_id}.
ALWAYS use the appropriate tool before answering.
Never call any other tool. Never hallucinate tool names.
After getting results, summarize clearly and cite XPath locations.""")
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
