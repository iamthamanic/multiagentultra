from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class TaskStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    FAILED = "failed"

class RAGLevel(enum.Enum):
    PROJECT = "project"
    CREW = "crew"
    AGENT = "agent"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    crews = relationship("Crew", back_populates="project", cascade="all, delete-orphan")
    rag_stores = relationship("RAGStore", back_populates="project", cascade="all, delete-orphan")

class Crew(Base):
    __tablename__ = "crews"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    crew_type = Column(String(50))  # research, development, analysis, etc.
    status = Column(String(20), default="active")
    config = Column(JSON)  # CrewAI specific configuration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="crews")
    agents = relationship("Agent", back_populates="crew", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="crew", cascade="all, delete-orphan")
    rag_stores = relationship("RAGStore", back_populates="crew", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False) 
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    goal = Column(Text)
    backstory = Column(Text)
    tools = Column(JSON)  # List of available tools
    llm_config = Column(JSON)  # LLM specific configuration
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    crew = relationship("Crew", back_populates="agents")
    tasks = relationship("Task", back_populates="agent", cascade="all, delete-orphan")
    rag_stores = relationship("RAGStore", back_populates="agent", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority = Column(Integer, default=1)
    input_data = Column(JSON)
    result = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    crew = relationship("Crew", back_populates="tasks")
    agent = relationship("Agent", back_populates="tasks")

class RAGStore(Base):
    __tablename__ = "rag_stores"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    level = Column(Enum(RAGLevel), nullable=False)
    name = Column(String(200), nullable=False)
    content = Column(Text)
    metadata = Column(JSON)
    vector_id = Column(String(100))  # Reference to vector database
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="rag_stores")
    crew = relationship("Crew", back_populates="rag_stores")
    agent = relationship("Agent", back_populates="rag_stores")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))
    file_type = Column(String(50))
    processed = Column(Boolean, default=False)
    embeddings_created = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())