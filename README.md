# MultiAgent Ultra

A powerful multi-agent system built with Next.js and FastAPI, featuring CrewAI integration for intelligent task orchestration and RAG capabilities for knowledge management.

## 🚀 Features

### Frontend (Next.js 15.3.4)
- **Modern React 19** with TypeScript and Tailwind CSS
- **Real-time Dashboard** with live backend connection monitoring
- **Multi-view Interface**: Projects, Crews, Agents, Knowledge Management
- **Responsive Design** with professional UI components
- **API Integration** with automatic retry and error handling
- **WebSocket Support** for real-time agent status updates

### Backend (FastAPI)
- **Multi-Agent Orchestration** powered by CrewAI
- **RAG System** with ChromaDB for vector search and knowledge retrieval
- **RESTful API** with comprehensive endpoints for all entities
- **Real-time Communication** via WebSockets
- **Authentication System** with JWT tokens
- **Database Integration** with SQLAlchemy and SQLite
- **Comprehensive Testing** with pytest

## 🏗️ Architecture

```
multiagent-ultra/
├── src/                    # Next.js Frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── config/           # API configuration
│   └── hooks/            # Custom React hooks
├── backend/               # FastAPI Backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configuration
│   │   ├── crew/         # CrewAI management
│   │   └── rag/          # RAG system
│   ├── models/           # Data schemas
│   ├── services/         # Business logic
│   └── tests/            # Test suite
└── public/               # Static assets
```

## 🛠️ Technologies

**Frontend:**
- Next.js 15.3.4 with Turbopack
- React 19 with TypeScript
- Tailwind CSS 4
- WebSocket client for real-time updates

**Backend:**
- FastAPI 0.104.1 with Uvicorn
- CrewAI 0.134.0 for multi-agent orchestration
- ChromaDB for vector database and RAG
- SQLAlchemy with SQLite
- WebSocket server for real-time communication
- JWT authentication with PassLib

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd multiagent-ultra
```

2. **Frontend Setup**
```bash
npm install
```

3. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Application

1. **Start the Backend** (Port 8888)
```bash
cd backend
source venv/bin/activate
python main.py
```

2. **Start the Frontend** (Port 3000)
```bash
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8888
- API Documentation: http://localhost:8888/docs

## 📡 API Endpoints

### Core Endpoints
- `GET /` - Health check
- `GET /api/v1/health` - Detailed health status

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Crews
- `GET /api/v1/crews` - List all crews
- `POST /api/v1/crews` - Create new crew
- `GET /api/v1/crews/{id}` - Get crew details

### Agents
- `GET /api/v1/agents` - List all agents
- `POST /api/v1/agents` - Create new agent
- `GET /api/v1/agents/{id}` - Get agent details

### Tasks
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/{id}` - Get task details

### RAG System
- `GET /api/v1/rag/stores` - List knowledge stores
- `POST /api/v1/rag/upload` - Upload documents
- `POST /api/v1/rag/search` - Search knowledge base
- `GET /api/v1/rag/stats` - Get RAG statistics

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Linting
```bash
npm run lint
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8888
NEXT_PUBLIC_WS_URL=ws://localhost:8888/ws
```

### Backend Configuration
The backend configuration is managed in `backend/app/core/config.py`

## 📦 Recent Updates

### Version 1.1 Features
- ✅ **Port Configuration**: Changed backend to port 8888 to avoid conflicts
- ✅ **API Integration**: Complete frontend-backend connection with real data
- ✅ **Enhanced Dashboard**: Real-time connection monitoring and status updates
- ✅ **Improved Error Handling**: Comprehensive error handling with retry mechanisms
- ✅ **Project Management**: Enhanced project API with validation and better error handling
- ✅ **RAG Integration**: Full knowledge management system with vector search
- ✅ **WebSocket Support**: Real-time agent status and task updates

### Bug Fixes
- Fixed dependency conflicts in requirements.txt
- Resolved Pydantic v2 configuration warnings
- Improved database initialization and connection handling
- Enhanced CORS configuration for development

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

For support and questions, please open an issue in the repository.

---

**Last Updated**: June 2025 - Version 1.1
**Status**: Active Development