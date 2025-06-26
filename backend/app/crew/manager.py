from crewai import Crew, Agent, Task
from crewai.tools import BaseTool
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.schemas import Crew as CrewModel, Agent as AgentModel, Task as TaskModel
from app.rag.retriever import HierarchicalRAG
import json

class CrewAIManager:
    """Manager class for CrewAI integration with hierarchical RAG"""
    
    def __init__(self, db: Session):
        self.db = db
        self.rag_retriever = HierarchicalRAG()
        self.active_crews: Dict[int, Crew] = {}
    
    async def create_crew_from_db(self, crew_id: int) -> Crew:
        """Create a CrewAI Crew instance from database configuration"""
        crew_model = self.db.query(CrewModel).filter(CrewModel.id == crew_id).first()
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
        
        self.active_crews[crew_id] = crew
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
        
        crew = self.active_crews[crew_id]
        
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
        # This would configure the specific LLM for the agent
        # For now, return None to use default
        return None
    
    def _get_manager_llm(self, config: Dict[str, Any]):
        """Get manager LLM configuration"""
        # This would configure the manager LLM
        return None
    
    async def get_crew_status(self, crew_id: int) -> Dict[str, Any]:
        """Get status of a crew"""
        crew_model = self.db.query(CrewModel).filter(CrewModel.id == crew_id).first()
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