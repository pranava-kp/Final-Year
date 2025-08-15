"""
ChromaDB vector store utilities for interview questions.

This module provides a thin wrapper around a persistent ChromaDB client and a
collection configured to store and retrieve interview questions with metadata
such as domain, difficulty, and rubric association. It uses Google Generative AI
embeddings via LangChain for embedding generation.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.api.models.Collection import Collection
from langchain_google_genai import GoogleGenerativeAIEmbeddings


class _LangChainEmbeddingFunction:
    """
    Adapter to use LangChain embeddings with ChromaDB's embedding_function API.
    """

    def __init__(self, embeddings: GoogleGenerativeAIEmbeddings) -> None:
        self._embeddings = embeddings

    def name(self) -> str:  # Chroma may call this to detect conflicts
        try:
            model_name = getattr(self._embeddings, "model", "models/embedding-001")
            return f"langchain-google-genai:{model_name}"
        except Exception:
            return "langchain-google-genai:unknown"

    def __call__(self, input: List[str]) -> List[List[float]]:  # type: ignore[override]
        # Chroma calls with parameter name 'input'
        if not isinstance(input, list):  # defensive
            input = [str(input)]  # type: ignore[list-item]
        return self._embeddings.embed_documents(input)


class VectorStore:
    """
    Vector store wrapper for question retrieval backed by ChromaDB.
    """

    def __init__(
        self,
        collection_name: str = "questions",
        persist_directory: Optional[str] = None,
    ) -> None:
        self._persist_directory = (
            persist_directory or os.getenv("CHROMA_DB_DIR", ".chroma")
        )
        os.makedirs(self._persist_directory, exist_ok=True)

        # Initialize embeddings (Google Generative AI Embeddings)
        # Requires GOOGLE_API_KEY to be set in the environment
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        embedding_fn = _LangChainEmbeddingFunction(embeddings)

        # Create a persistent client and collection
        self._client = chromadb.PersistentClient(path=self._persist_directory)
        # Configure cosine distance for similarity
        self._collection: Collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=embedding_fn,
        )

    @property
    def collection(self) -> Collection:
        return self._collection

    def upsert_questions(self, items: List[Dict[str, Any]]) -> None:
        """
        Upsert a list of question items into the collection.

        Each item should contain:
        - id: str
        - text: str  (the question text)
        - domain: str
        - difficulty: int
        - ideal_answer_snippet: str
        - rubric_id: Optional[str]
        Additional metadata fields can be included and will be stored.
        """

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for item in items:
            question_id = item.get("id")
            if not question_id:
                raise ValueError("Each item must include an 'id' field")

            ids.append(str(question_id))
            documents.append(item["text"])  # primary content used for embedding

            metadata: Dict[str, Any] = {
                "domain": item.get("domain"),
                "difficulty": item.get("difficulty"),
                "ideal_answer_snippet": item.get("ideal_answer_snippet"),
                "rubric_id": item.get("rubric_id"),
            }
            # Include any other provided keys as metadata
            for k, v in item.items():
                if k not in metadata and k not in {"id", "text"}:
                    metadata[k] = v
            metadatas.append(metadata)

        self._collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def query_similar(
        self,
        query_text: str,
        top_k: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Query the collection for the most similar questions.

        Returns a list of dicts with: id, text, metadata, and relevance_score.
        """

        where = where or {}
        result = self._collection.query(
            query_texts=[query_text],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        ids = result.get("ids", [[]])[0]
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])
        distances_list: List[float] = distances[0] if distances else [0.0] * len(docs)

        candidates: List[Dict[str, Any]] = []
        for i, doc in enumerate(docs):
            dist = distances_list[i] if i < len(distances_list) else 0.0
            # Convert cosine distance to a [0,1] relevance score (1 is most similar)
            relevance_score = max(0.0, min(1.0, 1.0 - float(dist)))
            candidates.append(
                {
                    "id": ids[i] if i < len(ids) else None,
                    "text": doc,
                    "metadata": metas[i] if i < len(metas) else {},
                    "relevance_score": relevance_score,
                }
            )

        return candidates


_shared_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """
    Return a shared VectorStore instance to avoid repeated client initialization.
    """

    global _shared_vector_store
    if _shared_vector_store is None:
        _shared_vector_store = VectorStore()
    return _shared_vector_store


