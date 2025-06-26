from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from models.schemas import RAGStore, RAGLevel
from app.core.config import settings
import json

class HierarchicalRAG:
    """Hierarchical RAG system with Project -> Crew -> Agent levels"""
    
    def __init__(self):
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Initialize sentence transformer for embeddings
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create collections for each RAG level
        self.project_collection = self.chroma_client.get_or_create_collection(
            name="project_rag",
            metadata={"description": "Project level knowledge base"}
        )
        
        self.crew_collection = self.chroma_client.get_or_create_collection(
            name="crew_rag", 
            metadata={"description": "Crew level knowledge base"}
        )
        
        self.agent_collection = self.chroma_client.get_or_create_collection(
            name="agent_rag",
            metadata={"description": "Agent level knowledge base"}
        )
    
    async def add_knowledge(self, level: RAGLevel, entity_id: int, content: str, metadata: Dict[str, Any] = None) -> str:
        """Add knowledge to the appropriate RAG level"""
        # Generate embedding
        embedding = self.embedding_model.encode([content])[0].tolist()
        
        # Prepare metadata
        doc_metadata = {
            "entity_id": entity_id,
            "level": level.value,
            **(metadata or {})
        }
        
        # Choose collection based on level
        collection = self._get_collection_by_level(level)
        
        # Generate unique ID
        doc_id = f"{level.value}_{entity_id}_{len(collection.get()['ids'])}"
        
        # Add to ChromaDB
        collection.add(
            documents=[content],
            embeddings=[embedding],
            metadatas=[doc_metadata],
            ids=[doc_id]
        )
        
        return doc_id
    
    async def get_project_context(self, project_id: int, query: str = "", top_k: int = 5) -> str:
        """Retrieve project-level context"""
        if query:
            # Query-based retrieval
            query_embedding = self.embedding_model.encode([query])[0].tolist()
            results = self.project_collection.query(
                query_embeddings=[query_embedding],
                where={"entity_id": project_id},
                n_results=top_k
            )
        else:
            # Get all project knowledge
            results = self.project_collection.get(
                where={"entity_id": project_id}
            )
        
        # Combine documents into context
        documents = results.get('documents', [[]])[0] if query else results.get('documents', [])
        context = "\n\n".join(documents) if documents else "No project context available."
        
        return context
    
    async def get_crew_context(self, crew_id: int, query: str = "", top_k: int = 5) -> str:
        """Retrieve crew-level context"""
        if query:
            query_embedding = self.embedding_model.encode([query])[0].tolist()
            results = self.crew_collection.query(
                query_embeddings=[query_embedding],
                where={"entity_id": crew_id},
                n_results=top_k
            )
        else:
            results = self.crew_collection.get(
                where={"entity_id": crew_id}
            )
        
        documents = results.get('documents', [[]])[0] if query else results.get('documents', [])
        context = "\n\n".join(documents) if documents else "No crew context available."
        
        return context
    
    async def get_agent_context(self, agent_id: int, query: str = "", top_k: int = 3) -> str:
        """Retrieve agent-level context"""
        if query:
            query_embedding = self.embedding_model.encode([query])[0].tolist()
            results = self.agent_collection.query(
                query_embeddings=[query_embedding],
                where={"entity_id": agent_id},
                n_results=top_k
            )
        else:
            results = self.agent_collection.get(
                where={"entity_id": agent_id}
            )
        
        documents = results.get('documents', [[]])[0] if query else results.get('documents', [])
        context = "\n\n".join(documents) if documents else "No agent context available."
        
        return context
    
    async def search_across_levels(self, query: str, project_id: int, crew_id: int = None, agent_id: int = None) -> Dict[str, str]:
        """Search across all relevant RAG levels for a query"""
        query_embedding = self.embedding_model.encode([query])[0].tolist()
        
        results = {}
        
        # Project level search
        project_results = self.project_collection.query(
            query_embeddings=[query_embedding],
            where={"entity_id": project_id},
            n_results=3
        )
        results["project"] = "\n".join(project_results.get('documents', [[]])[0])
        
        # Crew level search (if crew_id provided)
        if crew_id:
            crew_results = self.crew_collection.query(
                query_embeddings=[query_embedding],
                where={"entity_id": crew_id},
                n_results=3
            )
            results["crew"] = "\n".join(crew_results.get('documents', [[]])[0])
        
        # Agent level search (if agent_id provided)
        if agent_id:
            agent_results = self.agent_collection.query(
                query_embeddings=[query_embedding],
                where={"entity_id": agent_id},
                n_results=2
            )
            results["agent"] = "\n".join(agent_results.get('documents', [[]])[0])
        
        return results
    
    def _get_collection_by_level(self, level: RAGLevel):
        """Get ChromaDB collection based on RAG level"""
        if level == RAGLevel.PROJECT:
            return self.project_collection
        elif level == RAGLevel.CREW:
            return self.crew_collection
        elif level == RAGLevel.AGENT:
            return self.agent_collection
        else:
            raise ValueError(f"Unknown RAG level: {level}")
    
    async def update_knowledge(self, doc_id: str, new_content: str, level: RAGLevel):
        """Update existing knowledge in RAG store"""
        collection = self._get_collection_by_level(level)
        
        # Generate new embedding
        new_embedding = self.embedding_model.encode([new_content])[0].tolist()
        
        # Update document
        collection.update(
            ids=[doc_id],
            documents=[new_content],
            embeddings=[new_embedding]
        )
    
    async def delete_knowledge(self, doc_id: str, level: RAGLevel):
        """Delete knowledge from RAG store"""
        collection = self._get_collection_by_level(level)
        collection.delete(ids=[doc_id])
    
    async def get_knowledge_stats(self, entity_id: int, level: RAGLevel) -> Dict[str, Any]:
        """Get statistics about knowledge stored for an entity"""
        collection = self._get_collection_by_level(level)
        
        results = collection.get(
            where={"entity_id": entity_id}
        )
        
        return {
            "level": level.value,
            "entity_id": entity_id,
            "document_count": len(results.get('ids', [])),
            "total_characters": sum(len(doc) for doc in results.get('documents', [])),
            "last_updated": "2024-01-01"  # This would be tracked in metadata
        }