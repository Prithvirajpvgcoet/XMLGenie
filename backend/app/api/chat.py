import uuid
import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
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

@router.websocket("/ws/{document_id}")
async def chat_websocket(websocket: WebSocket, document_id: int):
    await websocket.accept()
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            message = payload.get("message")
            if not message:
                continue

            input_state = {
                "messages": [HumanMessage(content=message)],
                "document_id": document_id
            }

            try:
                # Stream events from the graph
                async for event in graph.astream_events(input_state, config, version="v2"):
                    kind = event["event"]
                    if kind == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content:
                            await websocket.send_json({"type": "token", "content": content})
                    elif kind == "on_tool_start":
                        tool_name = event["name"]
                        await websocket.send_json({"type": "trace", "action": f"Calling tool: {tool_name}..."})
                    elif kind == "on_tool_end":
                        await websocket.send_json({"type": "trace", "action": "Tool call completed."})
                    elif kind == "on_chain_end" and event["name"] == "agent_node":
                        # We can also capture final message here if needed
                        pass
                
                # Send a done signal for this interaction
                await websocket.send_json({"type": "done", "thread_id": thread_id})

            except Exception as e:
                await websocket.send_json({"type": "error", "content": str(e)})

    except WebSocketDisconnect:
        print(f"Client disconnected from thread {thread_id}")
