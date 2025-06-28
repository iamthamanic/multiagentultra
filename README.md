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

## 🧪 Testing & Code Quality

### 🔧 Automatic Code Quality (Empfohlen)

```bash
# Alles auf einmal: ESLint Fix + Prettier + TypeScript Check
npm run code-quality

# Vor jedem Commit
npm run pre-commit
```

### 🎨 Frontend Quality Checks

```bash
# ESLint mit Auto-Fix
npm run lint:fix

# Prettier Formatierung
npm run format

# TypeScript Type Check
npm run type-check

# Unit Tests
npm run test

# Test Coverage
npm run test:coverage

# Build Test
npm run build
```

### 🐍 Backend Quality Checks

```bash
cd backend

# Install development dependencies
pip install -r requirements-dev.txt

# Code formatting
black .
isort .

# Linting
flake8 . --max-line-length=100

# Tests
pytest
```

### 🚀 Pre-commit Hooks (Einmalig einrichten)

```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Teste alle Files
pre-commit run --all-files
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

### Version 1.3 - Senior Code Review & Performance Optimization (2025-06-28)

#### 🏗️ **Architecture Improvements**

- ✅ **Component Refactoring**: ArchitectView split from 279 → 144 lines into 4 focused components
- ✅ **API Consistency**: Unified fetch() calls to centralized api.get() across all components
- ✅ **Data Loading**: Generic useDataLoader hook eliminates code duplication
- ✅ **Function Optimization**: apiRequest broken down from 77 lines into 4 specialized functions

#### ⚡ **Performance Enhancements**

- ✅ **React.memo**: All major components optimized with memoization
- ✅ **useMemo**: Expensive calculations cached (sorting, className generation)
- ✅ **useCallback**: Event handlers optimized to prevent unnecessary re-renders
- ✅ **State Batching**: Custom hooks for batched state updates

#### 🛡️ **Error Handling & Reliability**

- ✅ **Error Boundaries**: Global error handling with retry functionality
- ✅ **Context API**: Centralized state management with useReducer
- ✅ **Missing Dependencies**: Fixed all useEffect dependency warnings
- ✅ **Type Safety**: Enhanced TypeScript coverage across components

#### 🧪 **Testing Infrastructure**

- ✅ **Unit Tests**: Comprehensive React Testing Library test suites
- ✅ **Component Tests**: ErrorBoundary, ProjectSelector, CreateProjectModal
- ✅ **Hook Tests**: useBatchedState, AppContext state management
- ✅ **Test Coverage**: Jest configuration with 70% minimum coverage
- ✅ **CI Integration**: Test scripts added to pre-commit workflow

#### 📱 **UI/UX Improvements**

- ✅ **Component Isolation**: Each UI element in separate, reusable components
- ✅ **Performance Monitoring**: Memoized props prevent unnecessary re-renders
- ✅ **Loading States**: Optimized loading indicators and empty states
- ✅ **Error Recovery**: User-friendly error messages with retry options

### Version 1.2 - Code Quality & Production Ready (2025-06-28)

- 🔧 **Code Quality Pipeline**: Comprehensive ESLint, Prettier, TypeScript setup
- 🚨 **Strict Linting Rules**: 3-tier approach (Errors, Best Practices, Style)
- 🔄 **Pre-commit Hooks**: Automated quality checks before every commit
- 🎯 **API Standardization**: All hardcoded URLs removed, centralized configuration
- 📦 **Dependency Cleanup**: Separate production/development requirements
- 🔒 **Security**: Added vulnerability scanning and secret detection
- 🤖 **CI/CD Pipeline**: GitHub Actions for automated testing and quality checks

### Version 1.2 - Critical Bug Fixes

- ✅ **Port Standardization**: Fixed inconsistent API endpoints (8888/8900/8001 → 8888)
- ✅ **TODO Implementation**: Completed missing project creation and mission briefing
- ✅ **Pydantic v2 Migration**: Fixed deprecated `schema_extra` warnings
- ✅ **Environment Variables**: Proper .env configuration with validation
- ✅ **Import Optimization**: Centralized API configuration across all components

### Version 1.1 Features

- ✅ **Port Configuration**: Changed backend to port 8888 to avoid conflicts
- ✅ **API Integration**: Complete frontend-backend connection with real data
- ✅ **Enhanced Dashboard**: Real-time connection monitoring and status updates
- ✅ **Improved Error Handling**: Comprehensive error handling with retry mechanisms
- ✅ **Project Management**: Enhanced project API with validation and better error handling
- ✅ **RAG Integration**: Full knowledge management system with vector search
- ✅ **WebSocket Support**: Real-time agent status and task updates

### Bug Fixes Archive

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

**Last Updated**: June 2025 - Version 1.3 (Performance Optimized)
**Status**: Production Ready with Enterprise-Grade Performance
**Code Quality**: ✅ Fully Automated (ESLint + Prettier + TypeScript + Pre-commit)
**Test Coverage**: ✅ Frontend Unit Tests + Backend Test Suite + 70% Coverage
**Performance**: ✅ React.memo + useMemo + useCallback + State Batching
**Architecture**: ✅ Component Refactoring + Error Boundaries + Context API
**Security**: ✅ Vulnerability Scanning + Secret Detection
