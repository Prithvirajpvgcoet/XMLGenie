import uuid
from fastapi import APIRouter, Depends
from langchain_core.messages import HumanMessage
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.agent.graph import graph

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat_with_xml(req: ChatRequest):
    thread_id = req.thread_id or str(uuid.uuid4())
    
    # LangGraph configuration for memory/threads
    config = {"configurable": {"thread_id": thread_id}}
    
    input_state = {
        "messages": [HumanMessage(content=req.message)],
        "document_id": req.document_id
    }
    
    # Run the graph
    result = await graph.ainvoke(input_state, config)
    
    # Extract the final response text
    final_message = result["messages"][-1].content
    
    return ChatResponse(
        thread_id=thread_id,
        response=final_message
    )
