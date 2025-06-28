import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.schemas import Project, Crew, Agent, Task, Base

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./multiagent_ultra.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Create tables
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_demo_data():
    db = SessionLocal()
    try:
        # Check if projects already exist
        existing_projects = db.query(Project).count()
        if existing_projects > 0:
            print(f"Demo data already exists ({existing_projects} projects found)")
            return

        # Create demo projects
        project1 = Project(
            name="AI-Powered Landing Page",
            description="Build a responsive landing page for Firma X using Next.js and TailwindCSS based on provided design.",
            status="active"
        )
        
        project2 = Project(
            name="Data Analysis Dashboard", 
            description="Create a comprehensive dashboard for analyzing customer data with real-time visualizations.",
            status="planning"
        )
        
        project3 = Project(
            name="API Integration Service",
            description="Develop a microservice to integrate with external APIs and handle data transformation.",
            status="completed"
        )

        db.add_all([project1, project2, project3])
        db.commit()
        
        # Get the projects back with their IDs
        db.refresh(project1)
        db.refresh(project2)
        db.refresh(project3)

        # Create demo crews for project 1
        crew1 = Crew(
            name="Frontend Development Team",
            description="Specialized team for React/Next.js development",
            project_id=project1.id,
            crew_type="development",
            config={"manager_llm": "claude-3-sonnet", "process": "sequential"}
        )
        
        crew2 = Crew(
            name="QA & Testing Team", 
            description="Quality assurance and testing specialists",
            project_id=project1.id,
            crew_type="quality_assurance",
            config={"manager_llm": "claude-3-sonnet", "process": "hierarchical"}
        )

        db.add_all([crew1, crew2])
        db.commit()
        
        db.refresh(crew1)
        db.refresh(crew2)

        # Create demo agents
        agent1 = Agent(
            name="Senior Frontend Developer",
            role="Senior Frontend Developer",
            goal="Build high-quality, responsive React components following best practices",
            backstory="You are an experienced frontend developer with 8+ years of experience in React, Next.js, and modern web technologies. You excel at creating clean, maintainable code and beautiful user interfaces.",
            crew_id=crew1.id,
            tools=[],
            llm_config={"model": "claude-3-sonnet", "temperature": 0.1}
        )
        
        agent2 = Agent(
            name="QA Testing Specialist",
            role="QA Testing Specialist", 
            goal="Ensure all code meets quality standards and is thoroughly tested",
            backstory="You are a meticulous QA engineer with expertise in automated testing, cross-browser compatibility, and performance optimization. You have a keen eye for detail and user experience.",
            crew_id=crew2.id,
            tools=[],
            llm_config={"model": "claude-3-sonnet", "temperature": 0.1}
        )
        
        agent3 = Agent(
            name="Project Manager",
            role="Project Manager",
            goal="Coordinate team efforts and ensure project milestones are met on time",
            backstory="You are an experienced project manager with a background in agile methodologies. You excel at breaking down complex projects into manageable tasks and keeping teams aligned.",
            crew_id=crew1.id,
            tools=[],
            llm_config={"model": "claude-3-sonnet", "temperature": 0.2}
        )

        db.add_all([agent1, agent2, agent3])
        db.commit()

        # Create demo tasks
        task1 = Task(
            name="Setup Project Structure",
            description="Initialize Next.js project with TypeScript, TailwindCSS, and essential dependencies",
            crew_id=crew1.id,
            agent_id=agent1.id,
            status="completed",
            expected_output="A working Next.js project with proper folder structure and dependencies",
            context="Use the latest Next.js 14+ with app router and TypeScript configuration"
        )
        
        task2 = Task(
            name="Implement Header Component",
            description="Create responsive header component based on design specifications",
            crew_id=crew1.id,
            agent_id=agent1.id,
            status="in_progress", 
            expected_output="Fully responsive header component with navigation menu",
            context="Header should work on mobile, tablet, and desktop. Include company logo and navigation links."
        )
        
        task3 = Task(
            name="Test Header Responsiveness",
            description="Verify header component works correctly across all device sizes",
            crew_id=crew2.id,
            agent_id=agent2.id,
            status="pending",
            expected_output="Test report confirming responsive behavior and any issues found",
            context="Test on Chrome, Firefox, Safari. Check mobile (320px+), tablet (768px+), desktop (1024px+)"
        )

        db.add_all([task1, task2, task3])
        db.commit()

        print("✅ Demo data initialized successfully!")
        print(f"Created {db.query(Project).count()} projects")
        print(f"Created {db.query(Crew).count()} crews") 
        print(f"Created {db.query(Agent).count()} agents")
        print(f"Created {db.query(Task).count()} tasks")

    except Exception as e:
        print(f"❌ Error initializing demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_demo_data()