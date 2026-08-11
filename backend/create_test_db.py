import asyncio
import asyncpg

async def main():
    try:
        conn = await asyncpg.connect(user="xmlgenie", password="xmlgenie_pass", host="localhost", port="5432", database="postgres")
        await conn.execute("CREATE DATABASE xmlgenie_test;")
        print("Database xmlgenie_test created successfully.")
        await conn.close()
    except asyncpg.exceptions.DuplicateDatabaseError:
        print("Database xmlgenie_test already exists.")
    except Exception as e:
        print(f"Error creating database: {e}")

    try:
        conn2 = await asyncpg.connect(user="xmlgenie", password="xmlgenie_pass", host="localhost", port="5432", database="xmlgenie_test")
        await conn2.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("Extension vector created successfully.")
        await conn2.close()
    except Exception as e:
        print(f"Error creating extension: {e}")

if __name__ == "__main__":
    asyncio.run(main())
