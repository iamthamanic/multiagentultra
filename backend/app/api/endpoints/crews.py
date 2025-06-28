from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from models.schemas import Crew, TaskStatus
from pydantic import BaseModel, Field

router = APIRouter()

class CrewCreate(BaseModel):
    project_id: int = Field(..., gt=0, description="Project ID must be positive")
    name: str = Field(..., min_length=1, max_length=100, description="Crew name")
    description: Optional[str] = Field(None, max_length=500, description="Crew description")
    crew_type: Optional[str] = Field(None, max_length=50, description="Crew type")

class CrewResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    crew_type: Optional[str] = None
    status: str
    created_at: str
    
    class Config:
        from_attributes = True

class CrewDetailResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    crew_type: Optional[str] = None
    status: str
    created_at: str
    agent_count: int
    task_count: int
    completed_tasks: int
    pending_tasks: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CrewResponse])
async def get_crews(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all crews, optionally filtered by project_id"""
    try:
        query = db.query(Crew)
        if project_id:
            query = query.filter(Crew.project_id == project_id)
        crews = query.all()
        return crews
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve crews: {str(e)}")

@router.post("/", response_model=CrewResponse)
async def create_crew(crew: CrewCreate, db: Session = Depends(get_db)):
    """Create a new crew"""
    try:
        # Validate project exists
        from models.schemas import Project
        project = db.query(Project).filter(Project.id == crew.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        db_crew = Crew(
            project_id=crew.project_id,
            name=crew.name,
            description=crew.description,
            crew_type=crew.crew_type
        )
        db.add(db_crew)
        db.commit()
        db.refresh(db_crew)
        return db_crew
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create crew: {str(e)}")

@router.get("/{crew_id}", response_model=CrewResponse)
async def get_crew(crew_id: int = Path(..., gt=0, description="Crew ID"), db: Session = Depends(get_db)):
    """Get a specific crew by ID"""
    try:
        crew = db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        return crew
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve crew: {str(e)}")

@router.put("/{crew_id}", response_model=CrewResponse)
async def update_crew(crew_update: CrewCreate, crew_id: int = Path(..., gt=0, description="Crew ID"), db: Session = Depends(get_db)):
    """Update an existing crew"""
    try:
        crew = db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        
        for field, value in crew_update.dict(exclude_unset=True).items():
            setattr(crew, field, value)
        
        db.commit()
        db.refresh(crew)
        return crew
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update crew: {str(e)}")

@router.delete("/{crew_id}")
async def delete_crew(crew_id: int = Path(..., gt=0, description="Crew ID"), db: Session = Depends(get_db)):
    """Delete a crew"""
    try:
        crew = db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        
        db.delete(crew)
        db.commit()
        return {"message": "Crew deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete crew: {str(e)}")

@router.get("/{crew_id}/details", response_model=CrewDetailResponse)
async def get_crew_details(crew_id: int = Path(..., gt=0, description="Crew ID"), db: Session = Depends(get_db)):
    """Get detailed crew information with statistics using eager loading"""
    try:
        # Use eager loading to prevent N+1 queries when accessing agents and tasks
        crew = db.query(Crew).options(
            joinedload(Crew.agents),
            joinedload(Crew.tasks)
        ).filter(Crew.id == crew_id).first()
        
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        
        # Calculate statistics efficiently using eager-loaded data
        agent_count = len(crew.agents)
        task_count = len(crew.tasks)
        completed_tasks = sum(1 for task in crew.tasks if task.status == TaskStatus.COMPLETED)
        pending_tasks = sum(1 for task in crew.tasks if task.status == TaskStatus.PENDING)
        
        # Create response with calculated fields
        response_data = {
            "id": crew.id,
            "project_id": crew.project_id,
            "name": crew.name,
            "description": crew.description,
            "crew_type": crew.crew_type,
            "status": crew.status,
            "created_at": crew.created_at.isoformat() if crew.created_at else "",
            "agent_count": agent_count,
            "task_count": task_count,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks
        }
        
        return CrewDetailResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve crew details: {str(e)}")

@router.get("/with-details", response_model=List[CrewDetailResponse])
async def get_crews_with_details(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all crews with statistics using eager loading to prevent N+1 queries"""
    try:
        query = db.query(Crew)
        if project_id:
            query = query.filter(Crew.project_id == project_id)
        
        # Use eager loading to fetch all related data in a single query
        crews = query.options(
            joinedload(Crew.agents),
            joinedload(Crew.tasks)
        ).all()
        
        # Build response data with statistics calculated from eager-loaded data
        response_data = []
        for crew in crews:
            agent_count = len(crew.agents)
            task_count = len(crew.tasks)
            completed_tasks = sum(1 for task in crew.tasks if task.status == TaskStatus.COMPLETED)
            pending_tasks = sum(1 for task in crew.tasks if task.status == TaskStatus.PENDING)
            
            crew_data = {
                "id": crew.id,
                "project_id": crew.project_id,
                "name": crew.name,
                "description": crew.description,
                "crew_type": crew.crew_type,
                "status": crew.status,
                "created_at": crew.created_at.isoformat() if crew.created_at else "",
                "agent_count": agent_count,
                "task_count": task_count,
                "completed_tasks": completed_tasks,
                "pending_tasks": pending_tasks
            }
            response_data.append(CrewDetailResponse(**crew_data))
        
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve crews with details: {str(e)}")