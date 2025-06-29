# MultiAgent Ultra V2 Frontend

Modern Next.js frontend for the MultiAgent Ultra platform - a comprehensive multi-agent AI system with CrewAI integration.

## Current Status (29.06.2025)

### Latest Changes & Bugfixes
- ✅ **Navigation Fixed**: Resolved menu navigation requiring multiple clicks
- ✅ **Ant Design Tabs Modernized**: Updated deprecated `TabPane` to modern `items` prop
- ✅ **Frontend-Backend Communication**: Stable connection between Next.js frontend (port 3001) and FastAPI backend (port 8888)
- ✅ **UI Stability**: All main pages (Dashboard, Projects, Crews, Agents, Knowledge, Mission Control, Logs) now load correctly
- ✅ **Provider Configuration**: Fixed component import resolution issues

### System Architecture
- **Frontend**: Next.js 15.3.4 with Turbopack (Port 3001)
- **Backend**: FastAPI with CrewAI integration (Port 8888)
- **State Management**: Redux Toolkit with persistence
- **UI Framework**: Ant Design with custom theming
- **Real-time Communication**: WebSocket integration for live agent monitoring

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- Backend server running on port 8888

### Installation & Setup

```bash
# Navigate to frontend directory
cd multiagent-ultra-v2

# Install dependencies
npm install

# Start development server
npm run dev -- --port 3001
```

Application runs at http://localhost:3001

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Features

### Core Functionality
- **Multi-Agent Dashboard**: Real-time monitoring of AI agents and crews
- **Project Management**: Create and manage AI automation projects
- **Crew Builder**: Configure agent teams with specific roles and tasks
- **Knowledge Base**: RAG-powered document management with vector indexing
- **Mission Control**: Central command center for agent orchestration
- **Live Logs**: Real-time agent activity monitoring with WebSocket integration

### Technical Features
- **TypeScript**: Full type safety across the application
- **Ant Design**: Professional UI components with custom theming
- **Redux Toolkit**: Centralized state management with persistence
- **React Query**: Efficient data fetching and caching
- **WebSocket Support**: Real-time updates from backend agents
- **Responsive Design**: Mobile-friendly interface

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router pages
│   ├── dashboard/         # Main dashboard
│   ├── projects/          # Project management
│   ├── crews/             # Agent crew management
│   ├── agents/            # Individual agent configuration
│   ├── knowledge/         # RAG knowledge base
│   ├── mission-control/   # Central command interface
│   ├── logs/              # Live agent monitoring
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── layout/           # Layout components (AppLayout, etc.)
│   ├── providers/        # React providers (Redux, Query, etc.)
│   └── ui/               # Base UI components
├── store/                # Redux store configuration
│   ├── slices/           # Redux slices
│   └── provider.tsx      # Store provider
└── styles/               # Global styles
```

## API Integration

### Backend Endpoints
- **Health**: `GET /api/v1/health` - Backend status
- **Projects**: `GET /api/v1/projects/` - Project management
- **Crews**: `GET /api/v1/crews/` - Crew management  
- **Agents**: `GET /api/v1/agents/` - Agent configuration
- **Knowledge**: `GET /api/v1/knowledge/` - Document management
- **WebSocket**: `WS /ws?project_id=0` - Real-time updates

### Connection Status
- Backend connection status is displayed in the sidebar
- Health checks run automatically every 2 seconds
- API calls include proper error handling and fallback data

## Development Guidelines

### Component Standards
- Use functional components with TypeScript
- Implement proper error boundaries
- Follow Ant Design design patterns
- Maintain responsive design principles

### State Management
- Use Redux Toolkit for global state
- Local state with useState for component-specific data
- React Query for server state management
- Persist important state across sessions

### Code Quality
- TypeScript strict mode enabled
- ESLint with React and TypeScript rules
- Prettier for code formatting
- Husky for pre-commit hooks

## Recent Bug Fixes

### Navigation Issues (Fixed)
- **Problem**: Menu items required 3 clicks to navigate
- **Solution**: Removed duplicate event handlers, added navigation validation
- **Files**: `src/components/layout/AppLayout.tsx`

### Ant Design Deprecation Warnings (Fixed)  
- **Problem**: `Tabs.TabPane` deprecation warnings
- **Solution**: Migrated to modern `items` prop syntax
- **Files**: `src/app/knowledge/page.tsx`

### Provider Import Resolution (Fixed)
- **Problem**: Module resolution errors for Providers component
- **Solution**: Fixed import paths and component exports
- **Files**: `src/components/providers/Providers.tsx`

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8888
NEXT_PUBLIC_WS_URL=ws://localhost:8888
```

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 29.06.2025  
**Version**: 2.0.0  
**Status**: Stable Development Environment