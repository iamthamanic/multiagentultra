from fastapi import WebSocket
from typing import Dict, List, Optional
import json
import asyncio
import threading
from datetime import datetime
from enum import Enum
import logging

# Configure logging
logger = logging.getLogger(__name__)

class LogType(Enum):
    THOUGHT = "thought"
    ACTION = "action"
    RESULT = "result"
    ERROR = "error"
    MILESTONE = "milestone"
    STATUS = "status"

class LogMessage:
    def __init__(
        self,
        type: LogType,
        agent_id: Optional[int],
        agent_name: Optional[str],
        crew_id: Optional[int],
        project_id: Optional[int],
        content: str,
        metadata: Optional[Dict] = None
    ):
        self.type = type
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.crew_id = crew_id
        self.project_id = project_id
        self.content = content
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()
        
    def to_dict(self):
        return {
            "type": self.type.value,
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "crew_id": self.crew_id,
            "project_id": self.project_id,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }

class ConnectionManager:
    def __init__(self):
        # Store connections by project_id for targeted broadcasts
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, Dict] = {}
        # Thread safety
        self._lock = threading.RLock()
        self._max_connections_per_project = 100  # Prevent DoS
        
    async def connect(self, websocket: WebSocket, project_id: int, user_id: Optional[int] = None):
        try:
            await websocket.accept()
            
            with self._lock:
                # Check connection limits
                current_connections = len(self.active_connections.get(project_id, []))
                if current_connections >= self._max_connections_per_project:
                    await websocket.close(code=1008, reason="Too many connections for this project")
                    logger.warning(f"Connection limit exceeded for project {project_id}")
                    return
                
                # Store connection metadata
                self.connection_metadata[websocket] = {
                    "project_id": project_id,
                    "user_id": user_id,
                    "connected_at": datetime.utcnow()
                }
                
                # Add to project connections
                if project_id not in self.active_connections:
                    self.active_connections[project_id] = []
                self.active_connections[project_id].append(websocket)
                
                client_count = len(self.active_connections[project_id])
            
            # Send connection confirmation (outside lock to avoid deadlock)
            await self.send_personal_message(
                websocket,
                LogMessage(
                    type=LogType.STATUS,
                    agent_id=None,
                    agent_name="System",
                    crew_id=None,
                    project_id=project_id,
                    content="Connected to live log stream",
                    metadata={"connected_clients": client_count}
                )
            )
            logger.info(f"WebSocket connected for project {project_id}, user {user_id}")
            
        except Exception as e:
            logger.error(f"Error connecting WebSocket: {e}")
            try:
                await websocket.close(code=1011, reason="Internal server error")
            except:
                pass
        
    def disconnect(self, websocket: WebSocket):
        with self._lock:
            metadata = self.connection_metadata.get(websocket)
            if metadata:
                project_id = metadata["project_id"]
                user_id = metadata.get("user_id")
                
                # Remove from project connections
                if project_id in self.active_connections:
                    try:
                        self.active_connections[project_id].remove(websocket)
                        if not self.active_connections[project_id]:
                            del self.active_connections[project_id]
                    except ValueError:
                        # WebSocket was already removed, which is fine
                        pass
                
                # Remove metadata
                del self.connection_metadata[websocket]
                logger.info(f"WebSocket disconnected for project {project_id}, user {user_id}")
            else:
                logger.warning("Attempted to disconnect unknown WebSocket")
            
    async def send_personal_message(self, websocket: WebSocket, message: LogMessage):
        try:
            await websocket.send_json(message.to_dict())
        except Exception as e:
            # Connection might be closed - clean it up
            logger.debug(f"Failed to send message to WebSocket: {e}")
            self.disconnect(websocket)
            
    async def broadcast_to_project(self, project_id: int, message: LogMessage):
        """Broadcast a message to all connections watching a specific project"""
        # Get connections safely
        with self._lock:
            connections = self.active_connections.get(project_id, []).copy()
        
        if connections:
            # Create tasks for all connections
            tasks = []
            for connection in connections:
                tasks.append(self.send_personal_message(connection, message))
            
            # Send to all connections concurrently
            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Log any exceptions (for debugging)
                failed_count = sum(1 for result in results if isinstance(result, Exception))
                if failed_count > 0:
                    logger.debug(f"Failed to broadcast to {failed_count}/{len(tasks)} connections for project {project_id}")
                
    async def broadcast_agent_thought(
        self,
        project_id: int,
        crew_id: int,
        agent_id: int,
        agent_name: str,
        thought: str,
        metadata: Optional[Dict] = None
    ):
        """Broadcast an agent's thought process"""
        message = LogMessage(
            type=LogType.THOUGHT,
            agent_id=agent_id,
            agent_name=agent_name,
            crew_id=crew_id,
            project_id=project_id,
            content=thought,
            metadata=metadata
        )
        await self.broadcast_to_project(project_id, message)
        
    async def broadcast_agent_action(
        self,
        project_id: int,
        crew_id: int,
        agent_id: int,
        agent_name: str,
        action: str,
        metadata: Optional[Dict] = None
    ):
        """Broadcast an agent's action"""
        message = LogMessage(
            type=LogType.ACTION,
            agent_id=agent_id,
            agent_name=agent_name,
            crew_id=crew_id,
            project_id=project_id,
            content=action,
            metadata=metadata
        )
        await self.broadcast_to_project(project_id, message)
        
    async def broadcast_milestone(
        self,
        project_id: int,
        crew_id: int,
        milestone_name: str,
        description: str,
        metadata: Optional[Dict] = None
    ):
        """Broadcast a milestone achievement"""
        message = LogMessage(
            type=LogType.MILESTONE,
            agent_id=None,
            agent_name="System",
            crew_id=crew_id,
            project_id=project_id,
            content=f"Milestone reached: {milestone_name} - {description}",
            metadata={
                "milestone_name": milestone_name,
                "requires_review": True,
                **(metadata or {})
            }
        )
        await self.broadcast_to_project(project_id, message)

# Global connection manager instance
ws_manager = ConnectionManager()