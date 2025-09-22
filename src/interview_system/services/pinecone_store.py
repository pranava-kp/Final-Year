import os
from typing import Any, Dict, List, Optional

from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# This global variable will hold our single store instance.
_vector_store_instance: Optional["PineconeVectorStore"] = None

# Using a constant for the index name is good practice.
PINECONE_INDEX_NAME = "agentic-rag"


class PineconeVectorStore:
    """A wrapper for the Pinecone vector store."""

    def __init__(self):
        """Initializes the connection to Pinecone and the embedding model."""
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY must be set in your .env file.")

        # This print statement is our diagnostic tool. It should only appear once.
        print(
            "--- Initializing Pinecone client and SentenceTransformer model ONCE. ---"
        )

        pc = Pinecone(api_key=api_key)

        if PINECONE_INDEX_NAME not in pc.list_indexes().names():
            # For this script, we assume the index exists. You could add creation logic here if needed.
            raise ValueError(
                f"Pinecone index '{PINECONE_INDEX_NAME}' does not exist. Please create it first."
            )

        self.index = pc.Index(PINECONE_INDEX_NAME)

        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

    def upsert_questions(
        self, items: List[Dict[str, Any]], namespace: str | None = None
    ) -> None:
        """
        Embeds and upserts a list of question documents into the Pinecone index,
        optionally into a specific namespace.
        """
        vectors_to_upsert = []
        for item in items:
            metadata = {
                "text": item["text"],
                "domain": item["domain"],
                "difficulty": item["difficulty"],
                "ideal_answer_snippet": item["ideal_answer_snippet"],
                "rubric_id": item.get("rubric_id"),
            }
            # This is the corrected embedding logic that includes the domain.
            text_to_embed = f"Domain: {item['domain']}. Question: {item['text']}"
            vector = self.embedding_model.encode(text_to_embed).tolist()

            vectors_to_upsert.append(
                {
                    "id": item["id"],
                    "values": vector,
                    "metadata": metadata,
                }
            )

        if vectors_to_upsert:
            # Pass the namespace to the upsert call if it's provided.
            if namespace:
                print(
                    f"Upserting {len(vectors_to_upsert)} questions to namespace: '{namespace}'"
                )
                self.index.upsert(vectors=vectors_to_upsert, namespace=namespace)
            else:
                print(
                    f"Upserting {len(vectors_to_upsert)} questions to default namespace."
                )
                self.index.upsert(vectors=vectors_to_upsert)

    def query_similar(
        self,
        query_text: str,
        top_k: int,
        where: Dict[str, Any],
        namespace: str | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Queries the index for similar questions based on text and metadata filters,
        optionally from a specific namespace.
        """
        query_vector = self.embedding_model.encode(query_text).tolist()

        # This handles the filter format correctly.
        pinecone_filter = where.get("$and", where)
        if isinstance(pinecone_filter, list):
            pinecone_filter = {k: v for d in pinecone_filter for k, v in d.items()}

        # Pass the namespace to the query call if it's provided.
        if namespace:
            print(f"Querying from namespace: '{namespace}'")
            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                filter=pinecone_filter,
                include_metadata=True,
                namespace=namespace,
            )
        else:
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


def get_vector_store() -> PineconeVectorStore:
    """Get a singleton instance of the PineconeVectorStore."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = PineconeVectorStore()
    return _vector_store_instance
