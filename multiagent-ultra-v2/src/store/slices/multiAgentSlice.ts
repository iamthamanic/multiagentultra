import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Crew {
  id: number;
  name: string;
  project_id: number;
  status: 'active' | 'inactive';
  agents_count: number;
}

export interface Agent {
  id: number;
  name: string;
  crew_id: number;
  role: string;
  status: 'active' | 'inactive' | 'busy';
  backstory?: string;
}

export interface LiveLog {
  id: string;
  timestamp: string;
  project_id: number;
  crew_id?: number;
  agent_id?: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface MultiAgentState {
  // Data
  projects: Project[];
  crews: Crew[];
  agents: Agent[];
  liveLogs: LiveLog[];
  
  // Loading states
  loading: {
    projects: boolean;
    crews: boolean;
    agents: boolean;
  };
  
  // Error states
  errors: {
    projects: string | null;
    crews: string | null;
    agents: string | null;
  };
  
  // UI state
  selectedProject: number | null;
  selectedCrew: number | null;
  backendConnection: boolean;
  
  // Stats
  stats: {
    totalProjects: number;
    totalCrews: number;
    totalAgents: number;
    activeTasks: number;
  };
}

const initialState: MultiAgentState = {
  projects: [],
  crews: [],
  agents: [],
  liveLogs: [],
  loading: {
    projects: false,
    crews: false,
    agents: false,
  },
  errors: {
    projects: null,
    crews: null,
    agents: null,
  },
  selectedProject: null,
  selectedCrew: null,
  backendConnection: false,
  stats: {
    totalProjects: 0,
    totalCrews: 0,
    totalAgents: 0,
    activeTasks: 0,
  },
};

const multiAgentSlice = createSlice({
  name: 'multiAgent',
  initialState,
  reducers: {
    // Backend Connection
    setBackendConnection: (state, action: PayloadAction<boolean>) => {
      state.backendConnection = action.payload;
    },

    // Projects
    setProjectsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.projects = action.payload;
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
      state.stats.totalProjects = action.payload.length;
      state.loading.projects = false;
      state.errors.projects = null;
    },
    setProjectsError: (state, action: PayloadAction<string>) => {
      state.errors.projects = action.payload;
      state.loading.projects = false;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.push(action.payload);
      state.stats.totalProjects = state.projects.length;
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    setSelectedProject: (state, action: PayloadAction<number | null>) => {
      state.selectedProject = action.payload;
    },

    // Crews
    setCrewsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.crews = action.payload;
    },
    setCrews: (state, action: PayloadAction<Crew[]>) => {
      state.crews = action.payload;
      state.stats.totalCrews = action.payload.length;
      state.stats.activeTasks = action.payload.filter(c => c.status === 'active').length;
      state.loading.crews = false;
      state.errors.crews = null;
    },
    setCrewsError: (state, action: PayloadAction<string>) => {
      state.errors.crews = action.payload;
      state.loading.crews = false;
    },
    addCrew: (state, action: PayloadAction<Crew>) => {
      state.crews.push(action.payload);
      state.stats.totalCrews = state.crews.length;
    },
    updateCrew: (state, action: PayloadAction<Crew>) => {
      const index = state.crews.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.crews[index] = action.payload;
      }
    },
    setSelectedCrew: (state, action: PayloadAction<number | null>) => {
      state.selectedCrew = action.payload;
    },

    // Agents
    setAgentsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.agents = action.payload;
    },
    setAgents: (state, action: PayloadAction<Agent[]>) => {
      state.agents = action.payload;
      state.stats.totalAgents = action.payload.length;
      state.loading.agents = false;
      state.errors.agents = null;
    },
    setAgentsError: (state, action: PayloadAction<string>) => {
      state.errors.agents = action.payload;
      state.loading.agents = false;
    },
    addAgent: (state, action: PayloadAction<Agent>) => {
      state.agents.push(action.payload);
      state.stats.totalAgents = state.agents.length;
    },
    updateAgent: (state, action: PayloadAction<Agent>) => {
      const index = state.agents.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.agents[index] = action.payload;
      }
    },

    // Live Logs
    addLiveLog: (state, action: PayloadAction<LiveLog>) => {
      state.liveLogs.unshift(action.payload); // Add to beginning
      // Keep only last 1000 logs for performance
      if (state.liveLogs.length > 1000) {
        state.liveLogs = state.liveLogs.slice(0, 1000);
      }
    },
    clearLiveLogs: (state) => {
      state.liveLogs = [];
    },

    // Reset actions
    resetProjects: (state) => {
      state.projects = [];
      state.loading.projects = false;
      state.errors.projects = null;
    },
    resetCrews: (state) => {
      state.crews = [];
      state.loading.crews = false;
      state.errors.crews = null;
    },
    resetAgents: (state) => {
      state.agents = [];
      state.loading.agents = false;
      state.errors.agents = null;
    },
  },
});

export const {
  setBackendConnection,
  setProjectsLoading,
  setProjects,
  setProjectsError,
  addProject,
  updateProject,
  setSelectedProject,
  setCrewsLoading,
  setCrews,
  setCrewsError,
  addCrew,
  updateCrew,
  setSelectedCrew,
  setAgentsLoading,
  setAgents,
  setAgentsError,
  addAgent,
  updateAgent,
  addLiveLog,
  clearLiveLogs,
  resetProjects,
  resetCrews,
  resetAgents,
} = multiAgentSlice.actions;

export default multiAgentSlice.reducer;