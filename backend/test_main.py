"""
Einfache Test-Version der MultiAgent Ultra API
Ohne komplexe Dependencies für Schnelltest
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="MultiAgent Ultra API - Test",
    description="Minimal test version",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "MultiAgent Ultra API Test ist running! 🚀"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "service": "MultiAgent Ultra API"}

@app.get("/api/v1/projects")
async def get_projects():
    return [
        {"id": 1, "name": "Test Project", "status": "active"},
        {"id": 2, "name": "Demo Project", "status": "pending"}
    ]

@app.post("/api/v1/projects")
async def create_project(project_data: dict):
    return {
        "id": 99,
        "name": project_data.get("name", "New Project"),
        "status": "created",
        "message": "Project created successfully"
    }

@app.get("/api/v1/crews")
async def get_crews():
    return [
        {"id": 1, "name": "Research Crew", "project_id": 1, "status": "active"},
        {"id": 2, "name": "Development Crew", "project_id": 1, "status": "active"}
    ]

@app.get("/api/v1/agents")
async def get_agents():
    return [
        {"id": 1, "name": "Research Agent", "crew_id": 1, "role": "researcher"},
        {"id": 2, "name": "Code Agent", "crew_id": 2, "role": "developer"}
    ]

if __name__ == "__main__":
    uvicorn.run(
        "test_main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )