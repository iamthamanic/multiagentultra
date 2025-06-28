from crewai import Agent
from typing import Any, Dict, Optional, List
import asyncio
from app.core.websocket import ws_manager
import json

class LiveLogAgent(Agent):
    """Extended Agent class that broadcasts live logs via WebSocket"""
    
    def __init__(
        self,
        role: str,
        goal: str,
        backstory: str,
        tools: List[Any] = None,
        project_id: int = None,
        crew_id: int = None,
        agent_id: int = None,
        **kwargs
    ):
        super().__init__(
            role=role,
            goal=goal,
            backstory=backstory,
            tools=tools or [],
            **kwargs
        )
        self.project_id = project_id
        self.crew_id = crew_id
        self.agent_id = agent_id
        self._original_execute = None
        
    def _broadcast_log(self, log_type: str, content: str, metadata: Optional[Dict] = None):
        """Send log message via WebSocket"""
        if self.project_id:
            # Run async broadcast in sync context
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # Schedule coroutine for later execution
                    asyncio.create_task(self._async_broadcast(log_type, content, metadata))
                else:
                    # Run in new event loop
                    asyncio.run(self._async_broadcast(log_type, content, metadata))
            except:
                # Fallback if asyncio fails
                pass
                
    async def _async_broadcast(self, log_type: str, content: str, metadata: Optional[Dict] = None):
        """Async broadcast implementation"""
        if log_type == "thought":
            await ws_manager.broadcast_agent_thought(
                project_id=self.project_id,
                crew_id=self.crew_id,
                agent_id=self.agent_id,
                agent_name=self.role,
                thought=content,
                metadata=metadata
            )
        elif log_type == "action":
            await ws_manager.broadcast_agent_action(
                project_id=self.project_id,
                crew_id=self.crew_id,
                agent_id=self.agent_id,
                agent_name=self.role,
                action=content,
                metadata=metadata
            )
            
    def execute(self, task: Any) -> Any:
        """Override execute to add live logging"""
        # Broadcast task start
        self._broadcast_log(
            "action",
            f"Starting task: {task.description if hasattr(task, 'description') else str(task)}",
            {"task_id": getattr(task, 'id', None)}
        )
        
        # Intercept agent thinking process
        original_think = getattr(self, '_think', None)
        if original_think:
            def logged_think(*args, **kwargs):
                thought = original_think(*args, **kwargs)
                if thought:
                    self._broadcast_log("thought", str(thought))
                return thought
            self._think = logged_think
        
        try:
            # Execute the task
            result = super().execute(task)
            
            # Broadcast task completion
            self._broadcast_log(
                "action",
                f"Completed task with result: {str(result)[:200]}...",
                {"task_id": getattr(task, 'id', None), "success": True}
            )
            
            return result
            
        except Exception as e:
            # Broadcast error
            self._broadcast_log(
                "action",
                f"Task failed with error: {str(e)}",
                {"task_id": getattr(task, 'id', None), "success": False, "error": str(e)}
            )
            raise
            
    def use_tool(self, tool_name: str, *args, **kwargs) -> Any:
        """Override tool usage to add live logging"""
        self._broadcast_log(
            "action",
            f"Using tool: {tool_name}",
            {"tool": tool_name, "args": str(args)[:100], "kwargs": str(kwargs)[:100]}
        )
        
        try:
            result = super().use_tool(tool_name, *args, **kwargs)
            self._broadcast_log(
                "action",
                f"Tool {tool_name} returned: {str(result)[:200]}...",
                {"tool": tool_name, "success": True}
            )
            return result
        except Exception as e:
            self._broadcast_log(
                "action",
                f"Tool {tool_name} failed: {str(e)}",
                {"tool": tool_name, "success": False, "error": str(e)}
            )
            raise