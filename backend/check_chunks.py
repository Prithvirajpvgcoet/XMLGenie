import sys, asyncio
sys.path.insert(0,'.')
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

engine = create_async_engine('postgresql+asyncpg://xmlgenie:xmlgenie_pass@localhost:5432/xmlgenie_db')
Session = async_sessionmaker(engine, class_=AsyncSession)

async def check():
    async with Session() as db:
        result = await db.execute(text(
            "SELECT id, document_id, xpath, LEFT(text_content, 120) as preview FROM chunks ORDER BY document_id DESC, id ASC LIMIT 30"
        ))
        rows = result.fetchall()
        print(f"Total chunks found: {len(rows)}")
        for r in rows:
            print(f"\ndocID={r[1]} | chunkID={r[0]} | xpath={r[2]}")
            print(f"  >> {r[3]}")

asyncio.run(check())
