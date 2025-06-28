from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
import uvicorn
from app.api.routes import router
from app.core.config import settings
from app.core.database import init_db
from app.core.websocket import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="MultiAgent Ultra API",
    description="CrewAI-powered Multi-Agent System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int = Query(...),
    user_id: Optional[int] = Query(None)
):
    """WebSocket endpoint for live agent logs and updates"""
    await ws_manager.connect(websocket, project_id, user_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # For now, just echo back - could handle commands here later
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "MultiAgent Ultra API is running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8900,
        reload=True
    )