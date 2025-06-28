from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Path
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from models.schemas import RAGStore, RAGLevel, KnowledgeBase
from app.rag.retriever import HierarchicalRAG
from pydantic import BaseModel, Field
import tempfile
import os

router = APIRouter()

class RAGStoreCreate(BaseModel):
    level: RAGLevel = Field(..., description="RAG level (project, crew, agent)")
    name: str = Field(..., min_length=1, max_length=200, description="Knowledge name")
    content: str = Field(..., min_length=1, description="Knowledge content")
    project_id: Optional[int] = Field(None, gt=0, description="Project ID for project-level RAG")
    crew_id: Optional[int] = Field(None, gt=0, description="Crew ID for crew-level RAG")
    agent_id: Optional[int] = Field(None, gt=0, description="Agent ID for agent-level RAG")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")

class RAGSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    level: Optional[RAGLevel] = Field(None, description="Specific RAG level to search")
    project_id: Optional[int] = Field(None, gt=0)
    crew_id: Optional[int] = Field(None, gt=0)
    agent_id: Optional[int] = Field(None, gt=0)
    top_k: int = Field(default=5, ge=1, le=20, description="Number of results to return")

class RAGStoreResponse(BaseModel):
    id: int
    level: RAGLevel
    name: str
    content: str
    project_id: Optional[int] = None
    crew_id: Optional[int] = None
    agent_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    vector_id: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True

class RAGStoreDetailResponse(BaseModel):
    id: int
    level: RAGLevel
    name: str
    content: str
    project_id: Optional[int] = None
    crew_id: Optional[int] = None
    agent_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    vector_id: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    # Entity information
    project_name: Optional[str] = None
    crew_name: Optional[str] = None
    agent_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class RAGSearchResponse(BaseModel):
    results: Dict[str, str]
    query: str
    total_results: int

# Initialize RAG retriever
rag_retriever = HierarchicalRAG()

@router.get("/stores", response_model=List[RAGStoreResponse])
async def get_rag_stores(
    level: Optional[RAGLevel] = None,
    project_id: Optional[int] = None,
    crew_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get RAG stores with optional filtering"""
    try:
        query = db.query(RAGStore)
        
        if level:
            query = query.filter(RAGStore.level == level)
        if project_id:
            query = query.filter(RAGStore.project_id == project_id)
        if crew_id:
            query = query.filter(RAGStore.crew_id == crew_id)
        if agent_id:
            query = query.filter(RAGStore.agent_id == agent_id)
        
        # Use eager loading to prevent N+1 queries when accessing related entities
        stores = query.options(
            joinedload(RAGStore.project),
            joinedload(RAGStore.crew),
            joinedload(RAGStore.agent)
        ).order_by(RAGStore.created_at.desc()).all()
        return stores
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve RAG stores: {str(e)}")

@router.post("/stores", response_model=RAGStoreResponse)
async def create_rag_store(rag_store: RAGStoreCreate, db: Session = Depends(get_db)):
    """Create a new RAG store entry"""
    try:
        # Validate entity IDs based on level
        if rag_store.level == RAGLevel.PROJECT and not rag_store.project_id:
            raise HTTPException(status_code=400, detail="project_id required for project-level RAG")
        elif rag_store.level == RAGLevel.CREW and not rag_store.crew_id:
            raise HTTPException(status_code=400, detail="crew_id required for crew-level RAG")
        elif rag_store.level == RAGLevel.AGENT and not rag_store.agent_id:
            raise HTTPException(status_code=400, detail="agent_id required for agent-level RAG")
        
        # Determine entity ID for RAG storage
        entity_id = None
        if rag_store.level == RAGLevel.PROJECT:
            entity_id = rag_store.project_id
        elif rag_store.level == RAGLevel.CREW:
            entity_id = rag_store.crew_id
        elif rag_store.level == RAGLevel.AGENT:
            entity_id = rag_store.agent_id
        
        # Add to vector database
        vector_id = await rag_retriever.add_knowledge(
            level=rag_store.level,
            entity_id=entity_id,
            content=rag_store.content,
            metadata=rag_store.metadata
        )
        
        # Create database entry
        db_rag_store = RAGStore(
            level=rag_store.level,
            name=rag_store.name,
            content=rag_store.content,
            project_id=rag_store.project_id,
            crew_id=rag_store.crew_id,
            agent_id=rag_store.agent_id,
            metadata=rag_store.metadata,
            vector_id=vector_id
        )
        db.add(db_rag_store)
        db.commit()
        db.refresh(db_rag_store)
        return db_rag_store
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create RAG store: {str(e)}")

@router.post("/search", response_model=RAGSearchResponse)
async def search_rag(search_request: RAGSearchRequest, db: Session = Depends(get_db)):
    """Search across RAG stores"""
    try:
        if search_request.level:
            # Search specific level
            if search_request.level == RAGLevel.PROJECT and search_request.project_id:
                results = {"project": await rag_retriever.get_project_context(
                    search_request.project_id, search_request.query, search_request.top_k
                )}
            elif search_request.level == RAGLevel.CREW and search_request.crew_id:
                results = {"crew": await rag_retriever.get_crew_context(
                    search_request.crew_id, search_request.query, search_request.top_k
                )}
            elif search_request.level == RAGLevel.AGENT and search_request.agent_id:
                results = {"agent": await rag_retriever.get_agent_context(
                    search_request.agent_id, search_request.query, search_request.top_k
                )}
            else:
                raise HTTPException(status_code=400, detail="Invalid level/ID combination")
        else:
            # Search across all relevant levels
            results = await rag_retriever.search_across_levels(
                query=search_request.query,
                project_id=search_request.project_id or 0,
                crew_id=search_request.crew_id,
                agent_id=search_request.agent_id
            )
        
        total_results = sum(1 for content in results.values() if content.strip())
        
        return RAGSearchResponse(
            results=results,
            query=search_request.query,
            total_results=total_results
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search RAG: {str(e)}")

@router.post("/upload")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    level: RAGLevel = RAGLevel.PROJECT,
    project_id: Optional[int] = None,
    crew_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Upload a file and add its content to RAG"""
    try:
        # Validate file type
        allowed_extensions = {".txt", ".md", ".pdf", ".docx"}
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract text content (simplified - in production, use proper parsers)
            if file_extension == ".txt" or file_extension == ".md":
                with open(temp_file_path, 'r', encoding='utf-8') as f:
                    text_content = f.read()
            else:
                # For PDF/DOCX, return placeholder (implement proper parsing)
                text_content = f"File content from {file.filename} (parsing not implemented yet)"
            
            # Create knowledge base entry
            db_knowledge = KnowledgeBase(
                name=file.filename,
                description=f"Uploaded file: {file.filename}",
                file_path=temp_file_path,
                file_type=file_extension,
                processed=True
            )
            db.add(db_knowledge)
            db.commit()
            
            # Add to RAG
            entity_id = project_id if level == RAGLevel.PROJECT else crew_id if level == RAGLevel.CREW else agent_id
            if not entity_id:
                raise HTTPException(status_code=400, detail="Entity ID required for the specified level")
            
            vector_id = await rag_retriever.add_knowledge(
                level=level,
                entity_id=entity_id,
                content=text_content,
                metadata={"filename": file.filename, "file_type": file_extension}
            )
            
            return {
                "message": "File uploaded and processed successfully",
                "filename": file.filename,
                "vector_id": vector_id,
                "content_length": len(text_content),
                "knowledge_id": db_knowledge.id
            }
        finally:
            # Clean up temp file
            os.unlink(temp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.get("/stats")
async def get_rag_stats(db: Session = Depends(get_db)):
    """Get RAG statistics"""
    try:
        # Count stores by level
        project_count = db.query(RAGStore).filter(RAGStore.level == RAGLevel.PROJECT).count()
        crew_count = db.query(RAGStore).filter(RAGStore.level == RAGLevel.CREW).count()
        agent_count = db.query(RAGStore).filter(RAGStore.level == RAGLevel.AGENT).count()
        
        # Get total content size using a more efficient approach
        all_stores = db.query(RAGStore).all()
        total_content_size = sum(
            len(store.content or "") for store in all_stores
        )
        
        return {
            "stores_by_level": {
                "project": project_count,
                "crew": crew_count,
                "agent": agent_count,
                "total": project_count + crew_count + agent_count
            },
            "total_content_size_bytes": total_content_size,
            "total_content_size_mb": round(total_content_size / (1024 * 1024), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get RAG stats: {str(e)}")

@router.delete("/stores/{store_id}")
async def delete_rag_store(store_id: int = Path(..., gt=0, description="RAG store ID"), db: Session = Depends(get_db)):
    """Delete a RAG store entry"""
    try:
        store = db.query(RAGStore).filter(RAGStore.id == store_id).first()
        if not store:
            raise HTTPException(status_code=404, detail="RAG store not found")
        
        # Remove from vector database
        if store.vector_id:
            await rag_retriever.delete_knowledge(store.vector_id, store.level)
        
        # Remove from database
        db.delete(store)
        db.commit()
        
        return {"message": "RAG store deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete RAG store: {str(e)}")

@router.get("/stores/detailed", response_model=List[RAGStoreDetailResponse])
async def get_rag_stores_detailed(
    level: Optional[RAGLevel] = None,
    project_id: Optional[int] = None,
    crew_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get RAG stores with detailed entity information using eager loading"""
    try:
        query = db.query(RAGStore)
        
        if level:
            query = query.filter(RAGStore.level == level)
        if project_id:
            query = query.filter(RAGStore.project_id == project_id)
        if crew_id:
            query = query.filter(RAGStore.crew_id == crew_id)
        if agent_id:
            query = query.filter(RAGStore.agent_id == agent_id)
        
        # Use eager loading to prevent N+1 queries when accessing related entities
        stores = query.options(
            joinedload(RAGStore.project),
            joinedload(RAGStore.crew),
            joinedload(RAGStore.agent)
        ).order_by(RAGStore.created_at.desc()).all()
        
        # Build detailed response with entity names
        response_data = []
        for store in stores:
            store_data = {
                "id": store.id,
                "level": store.level,
                "name": store.name,
                "content": store.content,
                "project_id": store.project_id,
                "crew_id": store.crew_id,
                "agent_id": store.agent_id,
                "metadata": store.meta_data,  # Note: field name is meta_data in schema
                "vector_id": store.vector_id,
                "created_at": store.created_at.isoformat() if store.created_at else "",
                "updated_at": store.updated_at.isoformat() if store.updated_at else None,
                "project_name": store.project.name if store.project else None,
                "crew_name": store.crew.name if store.crew else None,
                "agent_name": store.agent.name if store.agent else None
            }
            response_data.append(RAGStoreDetailResponse(**store_data))
        
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve detailed RAG stores: {str(e)}")