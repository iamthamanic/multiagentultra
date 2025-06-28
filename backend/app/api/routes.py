from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.endpoints import projects, crews, agents, tasks, rag, auth

router = APIRouter()

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(crews.router, prefix="/crews", tags=["crews"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
router.include_router(rag.router, prefix="/rag", tags=["rag"])

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MultiAgent Ultra API"}