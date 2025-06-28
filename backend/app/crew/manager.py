from crewai import Crew, Agent, Task
from crewai.tools import BaseTool
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from models.schemas import Crew as CrewModel, Agent as AgentModel, Task as TaskModel
from app.rag.retriever import HierarchicalRAG
import json
import time
import asyncio
from datetime import datetime, timedelta

class CrewActivity:
    """Track crew activity for memory management"""
    def __init__(self, crew: Crew):
        self.crew = crew
        self.last_activity = time.time()
        self.created_at = datetime.utcnow()
        self.task_count = 0
    
    def update_activity(self):
        self.last_activity = time.time()
    
    def is_inactive(self, timeout_seconds: int = 3600) -> bool:
        return time.time() - self.last_activity > timeout_seconds

class CrewAIManager:
    """Manager class for CrewAI integration with hierarchical RAG"""
    
    def __init__(self, db: Session, max_active_crews: int = 10, cleanup_interval: int = 300):
        self.db = db
        self.rag_retriever = HierarchicalRAG()
        self.active_crews: Dict[int, CrewActivity] = {}
        self.max_active_crews = max_active_crews
        self.cleanup_interval = cleanup_interval
        self.last_cleanup = time.time()
        self._cleanup_task = None
        
        # Start background cleanup task
        self._start_background_cleanup()
    
    async def create_crew_from_db(self, crew_id: int) -> Crew:
        """Create a CrewAI Crew instance from database configuration"""
        # Use eager loading to prevent N+1 queries
        crew_model = self.db.query(CrewModel).options(
            joinedload(CrewModel.agents),
            joinedload(CrewModel.tasks),
            joinedload(CrewModel.project)
        ).filter(CrewModel.id == crew_id).first()
        
        if not crew_model:
            raise ValueError(f"Crew with ID {crew_id} not found")
        
        # Get project-level RAG context
        project_context = await self.rag_retriever.get_project_context(crew_model.project_id)
        
        # Get crew-level RAG context
        crew_context = await self.rag_retriever.get_crew_context(crew_id)
        
        # Create CrewAI agents
        agents = []
        for agent_model in crew_model.agents:
            agent = await self._create_agent_from_db(agent_model, project_context, crew_context)
            agents.append(agent)
        
        # Create CrewAI crew
        crew = Crew(
            agents=agents,
            tasks=[],  # Tasks will be created dynamically
            verbose=True,
            memory=True,
            manager_llm=self._get_manager_llm(crew_model.config)
        )
        
        # Track crew activity
        activity = CrewActivity(crew)
        self.active_crews[crew_id] = activity
        
        # Ensure we don't exceed capacity
        self._ensure_capacity()
        
        return crew
    
    async def _create_agent_from_db(self, agent_model: AgentModel, project_context: str, crew_context: str) -> Agent:
        """Create a CrewAI Agent from database model"""
        # Get agent-specific RAG context
        agent_context = await self.rag_retriever.get_agent_context(agent_model.id)
        
        # Combine all context levels
        full_context = f"""
PROJECT CONTEXT:
{project_context}

CREW CONTEXT: 
{crew_context}

AGENT CONTEXT:
{agent_context}
        """
        
        # Create agent with hierarchical context
        agent = Agent(
            role=agent_model.role,
            goal=agent_model.goal,
            backstory=f"{agent_model.backstory}\n\nCONTEXT:\n{full_context}",
            tools=self._load_agent_tools(agent_model.tools),
            llm=self._get_agent_llm(agent_model.llm_config),
            verbose=True,
            memory=True
        )
        
        return agent
    
    async def execute_task(self, crew_id: int, task_description: str, task_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a task using the specified crew"""
        if crew_id not in self.active_crews:
            await self.create_crew_from_db(crew_id)
        
        activity = self.active_crews[crew_id]
        crew = activity.crew
        
        # Update activity tracking
        activity.update_activity()
        activity.task_count += 1
        
        # Create task for the crew
        task = Task(
            description=task_description,
            expected_output="Detailed analysis and actionable recommendations",
            agent=crew.agents[0] if crew.agents else None  # Assign to first agent by default
        )
        
        # Add task to crew
        crew.tasks = [task]
        
        # Execute the crew
        try:
            result = crew.kickoff()
            return {
                "success": True,
                "result": str(result),
                "crew_id": crew_id,
                "task_description": task_description
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "crew_id": crew_id,
                "task_description": task_description
            }
    
    def _load_agent_tools(self, tools_config: List[str]) -> List[BaseTool]:
        """Load tools for an agent based on configuration"""
        # This would load actual CrewAI tools based on configuration
        # For now, return empty list
        return []
    
    def _get_agent_llm(self, llm_config: Dict[str, Any]):
        """Get LLM configuration for agent"""
        from app.core.config import settings
        from crewai_tools import LLM
        
        if not llm_config:
            llm_config = {"provider": "openai", "model": "gpt-4"}
        
        provider = llm_config.get("provider", "openai")
        model = llm_config.get("model", "gpt-4")
        
        if provider == "openai" and settings.OPENAI_API_KEY:
            return LLM(
                model=f"openai/{model}",
                api_key=settings.OPENAI_API_KEY
            )
        elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            return LLM(
                model=f"anthropic/{model}",
                api_key=settings.ANTHROPIC_API_KEY
            )
        else:
            raise ValueError(f"No API key configured for provider: {provider}")
    
    def _get_manager_llm(self, config: Dict[str, Any]):
        """Get manager LLM configuration"""
        from app.core.config import settings
        from crewai_tools import LLM
        
        if not config:
            config = {"provider": "openai", "model": "gpt-4"}
        
        provider = config.get("provider", "openai")
        model = config.get("model", "gpt-4")
        
        if provider == "openai" and settings.OPENAI_API_KEY:
            return LLM(
                model=f"openai/{model}",
                api_key=settings.OPENAI_API_KEY
            )
        elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            return LLM(
                model=f"anthropic/{model}",
                api_key=settings.ANTHROPIC_API_KEY
            )
        else:
            return None
    
    async def get_crew_status(self, crew_id: int) -> Dict[str, Any]:
        """Get status of a crew with optimized query"""
        # Use eager loading to prevent N+1 queries
        crew_model = self.db.query(CrewModel).options(
            joinedload(CrewModel.agents),
            joinedload(CrewModel.tasks)
        ).filter(CrewModel.id == crew_id).first()
        
        if not crew_model:
            return {"error": "Crew not found"}
        
        return {
            "crew_id": crew_id,
            "name": crew_model.name,
            "status": crew_model.status,
            "agents_count": len(crew_model.agents),
            "active_tasks": len([t for t in crew_model.tasks if t.status == "in_progress"]),
            "is_running": crew_id in self.active_crews
        }
    
    def _start_background_cleanup(self):
        """Start background cleanup task with proper task management"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
    
    async def _cleanup_loop(self):
        """Background cleanup loop with error handling"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self.cleanup_inactive_crews()
                
                # Force cleanup if over capacity
                self._ensure_capacity()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in cleanup loop: {e}")
                await asyncio.sleep(60)  # Wait before retrying
    
    async def shutdown(self):
        """Gracefully shutdown the manager and cleanup resources"""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # Cleanup all active crews
        for crew_id in list(self.active_crews.keys()):
            try:
                activity = self.active_crews[crew_id]
                if hasattr(activity.crew, 'cleanup'):
                    activity.crew.cleanup()
                del self.active_crews[crew_id]
            except Exception as e:
                print(f"Error cleaning up crew {crew_id} during shutdown: {e}")
    
    async def cleanup_inactive_crews(self):
        """Remove inactive crews to prevent memory leaks"""
        current_time = time.time()
        inactive_crews = []
        
        # Find inactive crews (safe iteration)
        for crew_id, activity in list(self.active_crews.items()):
            if activity.is_inactive():
                inactive_crews.append(crew_id)
        
        # Clean up inactive crews
        cleaned_count = 0
        for crew_id in inactive_crews:
            try:
                activity = self.active_crews.get(crew_id)
                if not activity:
                    continue
                    
                # Clean up crew resources
                if hasattr(activity.crew, 'cleanup'):
                    if asyncio.iscoroutinefunction(activity.crew.cleanup):
                        await activity.crew.cleanup()
                    else:
                        activity.crew.cleanup()
                
                del self.active_crews[crew_id]
                cleaned_count += 1
                print(f"Cleaned up inactive crew {crew_id} (tasks: {activity.task_count}, inactive for: {current_time - activity.last_activity:.0f}s)")
                
            except Exception as e:
                print(f"Error cleaning up crew {crew_id}: {e}")
        
        if cleaned_count > 0:
            print(f"Cleanup completed: removed {cleaned_count} inactive crews, {len(self.active_crews)} remaining")
    
    def _ensure_capacity(self):
        """Ensure we don't exceed max active crews"""
        if len(self.active_crews) > self.max_active_crews:
            # Find oldest crew to remove
            oldest_crew_id = min(
                self.active_crews.keys(),
                key=lambda cid: self.active_crews[cid].last_activity
            )
            
            try:
                activity = self.active_crews[oldest_crew_id]
                if hasattr(activity.crew, 'cleanup'):
                    activity.crew.cleanup()
                
                del self.active_crews[oldest_crew_id]
                print(f"Removed oldest crew {oldest_crew_id} to maintain capacity")
            except Exception as e:
                print(f"Error removing crew {oldest_crew_id}: {e}")
    
    def get_active_crews_info(self) -> Dict[int, Dict[str, Any]]:
        """Get information about active crews for monitoring"""
        return {
            crew_id: {
                "last_activity": activity.last_activity,
                "created_at": activity.created_at.isoformat(),
                "task_count": activity.task_count,
                "is_inactive": activity.is_inactive()
            }
            for crew_id, activity in self.active_crews.items()
        }