from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from models.schemas import Project

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    try:
        projects = db.query(Project).all()
        result = []
        for project in projects:
            result.append({
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "status": project.status,
                "created_at": project.created_at.isoformat() if project.created_at else None
            })
        return result
    except Exception as e:
        print(f"Error getting projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}", response_model=dict)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "created_at": project.created_at.isoformat() if project.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))