from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from models.schemas import Agent
from pydantic import BaseModel, Field

router = APIRouter()

class AgentCreate(BaseModel):
    crew_id: int = Field(..., gt=0, description="Crew ID must be positive")
    name: str = Field(..., min_length=1, max_length=100, description="Agent name")
    role: str = Field(..., min_length=1, max_length=100, description="Agent role")
    goal: Optional[str] = Field(None, max_length=500, description="Agent goal")
    backstory: Optional[str] = Field(None, max_length=1000, description="Agent backstory")
    tools: Optional[List[str]] = Field(default=[], description="List of tools")
    llm_config: Optional[Dict[str, Any]] = Field(default={}, description="LLM configuration")

class AgentResponse(BaseModel):
    id: int
    crew_id: int
    name: str
    role: str
    goal: Optional[str] = None
    backstory: Optional[str] = None
    tools: Optional[List[str]] = None
    llm_config: Optional[Dict[str, Any]] = None
    status: str
    created_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[AgentResponse])
async def get_agents(crew_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all agents, optionally filtered by crew_id"""
    try:
        query = db.query(Agent)
        if crew_id:
            query = query.filter(Agent.crew_id == crew_id)
        agents = query.all()
        return agents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve agents: {str(e)}")

@router.post("/", response_model=AgentResponse)
async def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    """Create a new agent"""
    try:
        # Validate crew exists
        from models.schemas import Crew
        crew = db.query(Crew).filter(Crew.id == agent.crew_id).first()
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        
        db_agent = Agent(
            crew_id=agent.crew_id,
            name=agent.name,
            role=agent.role,
            goal=agent.goal,
            backstory=agent.backstory,
            tools=agent.tools,
            llm_config=agent.llm_config
        )
        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)
        return db_agent
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: int = Path(..., gt=0, description="Agent ID"), db: Session = Depends(get_db)):
    """Get a specific agent by ID"""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve agent: {str(e)}")

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_update: AgentCreate, agent_id: int = Path(..., gt=0, description="Agent ID"), db: Session = Depends(get_db)):
    """Update an existing agent"""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        for field, value in agent_update.dict(exclude_unset=True).items():
            setattr(agent, field, value)
        
        db.commit()
        db.refresh(agent)
        return agent
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update agent: {str(e)}")

@router.delete("/{agent_id}")
async def delete_agent(agent_id: int = Path(..., gt=0, description="Agent ID"), db: Session = Depends(get_db)):
    """Delete an agent"""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        db.delete(agent)
        db.commit()
        return {"message": "Agent deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete agent: {str(e)}")

@router.post("/{agent_id}/execute")
async def execute_agent_task(
    task_data: Dict[str, Any],
    agent_id: int = Path(..., gt=0, description="Agent ID"), 
    db: Session = Depends(get_db)
):
    """Execute a task with the specified agent"""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # TODO: Integrate with CrewAI manager for actual task execution
        # For now, return a placeholder response
        return {
            "agent_id": agent_id,
            "status": "executed",
            "result": f"Task executed by agent {agent.name}",
            "task_data": task_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute task: {str(e)}")