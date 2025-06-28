from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from models.schemas import Task, TaskStatus
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()

class TaskCreate(BaseModel):
    crew_id: int = Field(..., gt=0, description="Crew ID must be positive")
    agent_id: Optional[int] = Field(None, gt=0, description="Agent ID")
    name: str = Field(..., min_length=1, max_length=200, description="Task name")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    priority: int = Field(default=1, ge=1, le=5, description="Priority (1-5)")
    input_data: Optional[Dict[str, Any]] = Field(default={}, description="Task input data")

class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    crew_id: int
    agent_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    status: TaskStatus
    priority: int
    input_data: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    crew_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    db: Session = Depends(get_db)
):
    """Get all tasks with optional filtering"""
    try:
        query = db.query(Task)
        
        if crew_id:
            query = query.filter(Task.crew_id == crew_id)
        if agent_id:
            query = query.filter(Task.agent_id == agent_id)
        if status:
            query = query.filter(Task.status == status)
        
        tasks = query.order_by(Task.created_at.desc()).all()
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tasks: {str(e)}")

@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    try:
        # Validate crew exists
        from models.schemas import Crew
        crew = db.query(Crew).filter(Crew.id == task.crew_id).first()
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        
        # Validate agent exists if provided
        if task.agent_id:
            from models.schemas import Agent
            agent = db.query(Agent).filter(Agent.id == task.agent_id).first()
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
        
        db_task = Task(
            crew_id=task.crew_id,
            agent_id=task.agent_id,
            name=task.name,
            description=task.description,
            priority=task.priority,
            input_data=task.input_data,
            status=TaskStatus.PENDING
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int = Path(..., gt=0, description="Task ID"), db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve task: {str(e)}")

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_update: TaskUpdate, task_id: int = Path(..., gt=0, description="Task ID"), db: Session = Depends(get_db)):
    """Update a task status/result"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        update_data = task_update.dict(exclude_unset=True)
        
        # Handle status changes with timestamps
        if "status" in update_data:
            new_status = update_data["status"]
            if new_status == TaskStatus.IN_PROGRESS and not task.started_at:
                task.started_at = datetime.utcnow()
            elif new_status in [TaskStatus.COMPLETED, TaskStatus.FAILED] and not task.completed_at:
                task.completed_at = datetime.utcnow()
        
        for field, value in update_data.items():
            setattr(task, field, value)
        
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@router.delete("/{task_id}")
async def delete_task(task_id: int = Path(..., gt=0, description="Task ID"), db: Session = Depends(get_db)):
    """Delete a task"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        db.delete(task)
        db.commit()
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@router.post("/{task_id}/execute")
async def execute_task(task_id: int = Path(..., gt=0, description="Task ID"), db: Session = Depends(get_db)):
    """Execute a specific task"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.status != TaskStatus.PENDING:
            raise HTTPException(status_code=400, detail="Task is not in PENDING status")
        
        # Update task status to IN_PROGRESS
        task.status = TaskStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        db.commit()
        
        # TODO: Integrate with CrewAI manager for actual task execution
        # For now, return a placeholder response
        return {
            "task_id": task_id,
            "status": "execution_started",
            "message": f"Task '{task.name}' execution started"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute task: {str(e)}")