from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional, List
import os
import secrets
import string
from datetime import timedelta

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./multiagent_ultra.db", env="DATABASE_URL")
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY", min_length=32, description="Cryptographically secure secret key")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    @validator('SECRET_KEY')
    def validate_secret_key(cls, v):
        if not v:
            raise ValueError("SECRET_KEY is required and cannot be empty")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        if v == "your-secret-key-here" or v == "development-key":
            raise ValueError("SECRET_KEY cannot be a default/example value")
        return v
    
    @classmethod
    def generate_secret_key(cls) -> str:
        """Generate a cryptographically secure secret key."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(64))
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY", description="OpenAI API key for LLM operations")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY", description="Anthropic API key for Claude operations")
    CREWAI_API_KEY: Optional[str] = Field(default=None, env="CREWAI_API_KEY", description="CrewAI API key for agent operations")
    
    @validator('OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'CREWAI_API_KEY')
    def validate_api_keys(cls, v, field):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError(f"{field.name} cannot be empty string")
            if v.startswith('sk-') and len(v) < 40:
                raise ValueError(f"{field.name} appears to be invalid (too short)")
        return v
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = Field(default="./chroma_db", env="CHROMA_PERSIST_DIRECTORY")
    
    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:3000", env="CORS_ORIGINS")
    
    # Development
    DEBUG: bool = Field(default=False, env="DEBUG")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def access_token_expires_delta(self) -> timedelta:
        return timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    def validate_required_settings(self):
        """Validate that all critical settings are properly configured."""
        errors = []
        
        # Check database configuration
        if not self.DATABASE_URL:
            errors.append("DATABASE_URL is required")
            
        # Check if we're in production but using SQLite
        if not self.DEBUG and "sqlite" in self.DATABASE_URL.lower():
            errors.append("SQLite should not be used in production (set DEBUG=False)")
            
        # Validate CORS origins in production
        if not self.DEBUG:
            if "localhost" in self.CORS_ORIGINS or "*" in self.CORS_ORIGINS:
                errors.append("CORS origins should not include localhost/* in production")
        
        if errors:
            raise ValueError(f"Configuration errors: {'; '.join(errors)}")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Initialize settings and validate
settings = Settings()

# Validate configuration on startup
try:
    settings.validate_required_settings()
except ValueError as e:
    if settings.DEBUG:
        print(f"⚠️  Configuration warning: {e}")
    else:
        raise e