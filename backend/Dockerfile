FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for asyncpg / pgvector if any
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Ensure PYTHONPATH is set so that module imports work correctly
ENV PYTHONPATH=/app

COPY . .

EXPOSE 5000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
