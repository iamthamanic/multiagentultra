from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from models.schemas import Project, Crew
from pydantic import BaseModel, Field, validator

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    class Config:
        schema_extra = {
            "example": {
                "name": "AI Research Project",
                "description": "A project for AI research and development"
            }
        }

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    status: Optional[str] = Field(None, pattern="^(draft|active|completed|archived)$", description="Project status")
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_at: str
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProjectDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_at: str
    updated_at: Optional[str] = None
    crew_count: int
    total_agents: int
    total_tasks: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    projects = db.query(Project).all()
    return projects

@router.get("/with-stats", response_model=List[ProjectDetailResponse])
async def get_projects_with_stats(db: Session = Depends(get_db)):
    """Get all projects with statistics using eager loading to prevent N+1 queries"""
    try:
        # Use eager loading to fetch all related data in a single query
        projects = db.query(Project).options(
            joinedload(Project.crews).joinedload(Crew.agents),
            joinedload(Project.crews).joinedload(Crew.tasks)
        ).all()
        
        # Build response data with statistics calculated from eager-loaded data
        response_data = []
        for project in projects:
            crew_count = len(project.crews)
            total_agents = sum(len(crew.agents) for crew in project.crews)
            total_tasks = sum(len(crew.tasks) for crew in project.crews)
            
            project_data = {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "status": project.status,
                "created_at": project.created_at.isoformat() if project.created_at else "",
                "updated_at": project.updated_at.isoformat() if project.updated_at else None,
                "crew_count": crew_count,
                "total_agents": total_agents,
                "total_tasks": total_tasks
            }
            response_data.append(ProjectDetailResponse(**project_data))
        
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects with stats: {str(e)}")

@router.post("/", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    try:
        # Check for duplicate project names
        existing_project = db.query(Project).filter(Project.name == project.name).first()
        if existing_project:
            raise HTTPException(status_code=400, detail="Project with this name already exists")
        
        db_project = Project(
            name=project.name,
            description=project.description
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int = Path(..., gt=0, description="Project ID"), db: Session = Depends(get_db)):
    """Get a specific project by ID"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project: {str(e)}")

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_update: ProjectUpdate,
    project_id: int = Path(..., gt=0, description="Project ID"),
    db: Session = Depends(get_db)
):
    """Update a project"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check for duplicate names if name is being updated
        if project_update.name and project_update.name != project.name:
            existing_project = db.query(Project).filter(Project.name == project_update.name).first()
            if existing_project:
                raise HTTPException(status_code=400, detail="Project with this name already exists")
        
        # Update fields
        update_data = project_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        
        db.commit()
        db.refresh(project)
        return project
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(project_id: int = Path(..., gt=0, description="Project ID"), db: Session = Depends(get_db)):
    """Delete a project"""
    try:
        project = db.query(Project).options(joinedload(Project.crews)).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if project has associated crews/agents (prevent cascade deletion)
        if hasattr(project, 'crews') and project.crews:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete project with existing crews. Delete crews first."
            )
        
        db.delete(project)
        db.commit()
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

@router.get("/{project_id}/details", response_model=ProjectDetailResponse)
async def get_project_details(project_id: int = Path(..., gt=0, description="Project ID"), db: Session = Depends(get_db)):
    """Get detailed project information with statistics using eager loading"""
    try:
        # Use eager loading to prevent N+1 queries when accessing crews and their relationships
        project = db.query(Project).options(
            joinedload(Project.crews).joinedload(Crew.agents),
            joinedload(Project.crews).joinedload(Crew.tasks)
        ).filter(Project.id == project_id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Calculate statistics efficiently using eager-loaded data
        crew_count = len(project.crews)
        total_agents = sum(len(crew.agents) for crew in project.crews)
        total_tasks = sum(len(crew.tasks) for crew in project.crews)
        
        # Create response with calculated fields
        response_data = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "created_at": project.created_at.isoformat() if project.created_at else "",
            "updated_at": project.updated_at.isoformat() if project.updated_at else None,
            "crew_count": crew_count,
            "total_agents": total_agents,
            "total_tasks": total_tasks
        }
        
        return ProjectDetailResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project details: {str(e)}")