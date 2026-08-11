import asyncio
import json
import uuid
import httpx
from langchain_core.messages import HumanMessage
from app.services.agent.graph import graph

EVAL_FILE = "eval/eval_dataset.json"
XML_FILE = "../sample_data/invoices_v1.xml"

async def get_document_id() -> int:
    return 16 # We know invoices_v1.xml is ID 16 from previous upload

async def run_evaluation():
    with open(EVAL_FILE, "r") as f:
        dataset = json.load(f)
        
    doc_id = await get_document_id()
    
    passed = 0
    total = len(dataset)
    
    print("\n--- Starting Evaluation ---")
    
    for i, test in enumerate(dataset):
        question = test["question"]
        print(f"\n[{i+1}/{total}] Q: {question}")
        
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        input_state = {
            "messages": [HumanMessage(content=question)],
            "document_id": doc_id
        }
        
        # Run graph
        result = await graph.ainvoke(input_state, config)
        response_text = result["messages"][-1].content
        
        print(f"A: {response_text}")
        
        # Grading
        success = True
        
        # 1. Fact matching
        for fact in test["expected_facts"]:
            if fact.lower() not in response_text.lower():
                print(f"[FAIL] Missing fact: {fact}")
                success = False
                
        # 2. XPath matching
        for xpath in test["expected_xpaths"]:
            if xpath not in response_text:
                print(f"[FAIL] Missing XPath citation: {xpath}")
                success = False
                
        if success:
            print("[PASS]")
            passed += 1
            
    print("\n--- Evaluation Complete ---")
    score = (passed / total) * 100
    print(f"Final Score: {score:.1f}% ({passed}/{total} passed)")
    
    if score < 80.0:
        print("Warning: Evaluation score is below 80%. Agent requires tuning.")
    
if __name__ == "__main__":
    # Ensure database connection is ready, though LangGraph doesn't use the DB directly for states,
    # the search tool DOES use the database.
    # Because search_xml_document depends on get_db(), and we are calling the graph directly,
    # the graph runs locally in process without FastAPI request context.
    # BUT wait! search_xml_document tool uses `async for session in get_db():`
    # Let's ensure it can connect.
    asyncio.run(run_evaluation())
