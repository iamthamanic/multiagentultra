from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.websocket import ws_manager
import asyncio
import random

router = APIRouter()

@router.post("/demo-agent-activity/{project_id}")
async def demo_agent_activity(project_id: int, db: Session = Depends(get_db)):
    """Simulate agent activity for demo purposes"""
    
    # Simulate a sequence of agent activities
    demo_activities = [
        {
            "type": "thought",
            "agent_name": "Senior Frontend Developer",
            "content": "Analyzing the project requirements and planning the implementation approach..."
        },
        {
            "type": "action", 
            "agent_name": "Senior Frontend Developer",
            "content": "Setting up Next.js project structure with TypeScript"
        },
        {
            "type": "action",
            "agent_name": "Senior Frontend Developer", 
            "content": "Installing dependencies: TailwindCSS, React Icons, Framer Motion"
        },
        {
            "type": "thought",
            "agent_name": "QA Tester",
            "content": "Reviewing the project setup to ensure best practices are followed..."
        },
        {
            "type": "action",
            "agent_name": "QA Tester",
            "content": "Creating test environment and setting up Playwright testing framework"
        },
        {
            "type": "milestone",
            "agent_name": "Project Manager",
            "content": "Project initialization completed - ready for component development"
        },
        {
            "type": "thought",
            "agent_name": "Senior Frontend Developer",
            "content": "Starting with the header component based on the design specifications..."
        },
        {
            "type": "action",
            "agent_name": "Senior Frontend Developer",
            "content": "Creating responsive header component with navigation menu"
        },
        {
            "type": "action",
            "agent_name": "QA Tester",
            "content": "Testing header component responsiveness on mobile, tablet, and desktop"
        },
        {
            "type": "milestone",
            "agent_name": "Project Manager", 
            "content": "Header component completed and tested - requires architect review"
        }
    ]
    
    # Send each activity with realistic delays
    for i, activity in enumerate(demo_activities):
        # Broadcast the activity
        if activity["type"] == "thought":
            await ws_manager.broadcast_agent_thought(
                project_id=project_id,
                crew_id=1,
                agent_id=i % 3 + 1,
                agent_name=activity["agent_name"],
                thought=activity["content"]
            )
        elif activity["type"] == "action":
            await ws_manager.broadcast_agent_action(
                project_id=project_id,
                crew_id=1,
                agent_id=i % 3 + 1,
                agent_name=activity["agent_name"],
                action=activity["content"]
            )
        elif activity["type"] == "milestone":
            await ws_manager.broadcast_milestone(
                project_id=project_id,
                crew_id=1,
                milestone_name=f"Milestone {(i//3) + 1}",
                description=activity["content"]
            )
        
        # Wait between activities (realistic simulation)
        await asyncio.sleep(random.uniform(2, 5))
    
    return {"message": f"Demo agent activity completed for project {project_id}"}


@router.post("/demo-single-message/{project_id}")
async def demo_single_message(project_id: int, message_type: str = "thought", db: Session = Depends(get_db)):
    """Send a single demo message"""
    
    messages = {
        "thought": "I'm analyzing the best approach for this complex task...",
        "action": "Executing code generation with advanced algorithms",
        "milestone": "Major milestone achieved - system is ready for next phase",
        "error": "Encountered an issue, but I have a solution ready"
    }
    
    if message_type == "thought":
        await ws_manager.broadcast_agent_thought(
            project_id=project_id,
            crew_id=1,
            agent_id=1,
            agent_name="Demo Agent",
            thought=messages.get(message_type, "Demo thought process")
        )
    elif message_type == "action":
        await ws_manager.broadcast_agent_action(
            project_id=project_id,
            crew_id=1,
            agent_id=1,
            agent_name="Demo Agent",
            action=messages.get(message_type, "Demo action")
        )
    elif message_type == "milestone":
        await ws_manager.broadcast_milestone(
            project_id=project_id,
            crew_id=1,
            milestone_name="Demo Milestone",
            description=messages.get(message_type, "Demo milestone")
        )
    
    return {"message": f"Demo {message_type} sent to project {project_id}"}