from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Load model directly — no langchain dependency, no API key needed
_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of strings."""
    return _model.encode(texts, convert_to_numpy=True).tolist()

def embed_query(query: str) -> list[float]:
    """Generate embedding for a single search query."""
    return _model.encode([query], convert_to_numpy=True)[0].tolist()