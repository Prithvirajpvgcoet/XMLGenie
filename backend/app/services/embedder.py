from langchain_huggingface import HuggingFaceEmbeddings
import logging

logger = logging.getLogger(__name__)

# Use a local embedding model that has 768 dimensions (matches our DB schema)
# This completely bypasses the need for an API key!
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of strings."""
    return embeddings.embed_documents(texts)

def embed_query(query: str) -> list[float]:
    """Generate embedding for a single search query."""
    return embeddings.embed_query(query)