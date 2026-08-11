from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from app.services.agent.state import AgentState
from app.services.agent.tools import search_xml_document
from app.core.config import settings

# Initialize LLM
llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY
)

# Bind tools
tools = [search_xml_document]
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
    system = SystemMessage(content=f"""You are XMLGenie, an expert AI assistant for analyzing XML documents.
You have ONLY ONE tool available: search_xml_document.
The document you are working with has document_id = {doc_id}.
ALWAYS call search_xml_document with document_id={doc_id} and a relevant query before answering.
Never call any other tool. Never hallucinate tool names.
After getting search results, summarize the answer clearly and cite the XPath locations found.""")
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
