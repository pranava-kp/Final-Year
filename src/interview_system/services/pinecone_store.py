# src/interview_system/services/pinecone_store.py

import os
from typing import Any, Dict, List, Optional

from pinecone import Pinecone
# REMOVED: The import for ServerlessSpec is not needed for this library version.
from sentence_transformers import SentenceTransformer

# MODIFIED: Changed to use your existing index from the screenshot.
PINECONE_INDEX_NAME = "agentic-rag"
EMBEDDING_DIMENSION = 384

class PineconeVectorStore:
    """A wrapper for the Pinecone vector store."""

    def __init__(self):
        """Initializes the connection to Pinecone and the embedding model."""
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY must be set.")

        # The 'environment' variable is not needed for this initialization style
        pc = Pinecone(api_key=api_key)

        # This logic will now check for 'agentic-rag' and skip creation since it exists.
        if PINECONE_INDEX_NAME not in pc.list_indexes().names():
            print(f"Creating new Pinecone index: {PINECONE_INDEX_NAME}")
            # MODIFIED: The spec is now a simple dictionary.
            pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=EMBEDDING_DIMENSION,
                metric="cosine",
                spec={
                    "serverless": {
                        "cloud": "aws",
                        "region": "us-east-1"
                    }
                }
            )
        
        self.index = pc.Index(PINECONE_INDEX_NAME)

        self.embedding_model = SentenceTransformer(
            "all-MiniLM-L6-v2", device="cpu"
        )
        print("Pinecone vector store initialized.")

    def upsert_questions(self, items: List[Dict[str, Any]]) -> None:
        """Embeds and upserts a list of question documents into the Pinecone index."""
        vectors_to_upsert = []
        for item in items:
            metadata = {
                "text": item["text"],
                "domain": item["domain"],
                "difficulty": item["difficulty"],
                "ideal_answer_snippet": item["ideal_answer_snippet"],
                "rubric_id": item.get("rubric_id"),
            }
            vector = self.embedding_model.encode(item["text"]).tolist()
            
            vectors_to_upsert.append({
                "id": item["id"],
                "values": vector,
                "metadata": metadata,
            })
        
        if vectors_to_upsert:
            self.index.upsert(vectors=vectors_to_upsert)
            print(f"Upserted {len(vectors_to_upsert)} questions to Pinecone.")

    def query_similar(
        self, query_text: str, top_k: int, where: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Queries the index for similar questions based on text and metadata filters."""
        query_vector = self.embedding_model.encode(query_text).tolist()

        pinecone_filter = where.get("$and", where)
        if isinstance(pinecone_filter, list):
            pinecone_filter = {k: v for d in pinecone_filter for k, v in d.items()}

        results = self.index.query(
            vector=query_vector,
            top_k=top_k,
            filter=pinecone_filter,
            include_metadata=True,
        )

        formatted_candidates = []
        for match in results.get("matches", []):
            meta = match.get("metadata", {})
            candidate = {
                "id": match.get("id"),
                "text": meta.get("text", ""),
                "relevance_score": match.get("score", 0.0),
                "metadata": meta,
            }
            formatted_candidates.append(candidate)
        return formatted_candidates

_vector_store_instance: Optional[PineconeVectorStore] = None

def get_vector_store() -> PineconeVectorStore:
    """Get a singleton instance of the PineconeVectorStore."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = PineconeVectorStore()
    return _vector_store_instance