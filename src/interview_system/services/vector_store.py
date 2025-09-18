# src/interview_system/services/vector_store.py

from interview_system.services.pinecone_store import get_vector_store

# This file now acts as the single source of truth for getting the vector store.
# By changing the import here, the entire application switches from Chroma to Pinecone
# without needing any changes in the agent files that call get_vector_store().