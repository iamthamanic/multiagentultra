'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface Crew {
  id: number;
  name: string;
  project_id: number;
  status: string;
}

interface Agent {
  id: number;
  name: string;
  crew_id: number;
  status: string;
}

interface AppState {
  selectedProject: Project | null;
  selectedCrew: Crew | null;
  selectedAgent: Agent | null;
  loading: {
    projects: boolean;
    crews: boolean;
    agents: boolean;
  };
  errors: {
    projects: string | null;
    crews: string | null;
    agents: string | null;
  };
}

// Actions
type AppAction =
  | { type: 'SELECT_PROJECT'; payload: Project | null }
  | { type: 'SELECT_CREW'; payload: Crew | null }
  | { type: 'SELECT_AGENT'; payload: Agent | null }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AppState['errors']; value: string | null } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_SELECTIONS' };

// Initial state
const initialState: AppState = {
  selectedProject: null,
  selectedCrew: null,
  selectedAgent: null,
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
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_PROJECT':
      return {
        ...state,
        selectedProject: action.payload,
        selectedCrew: null, // Clear crew selection when project changes
        selectedAgent: null, // Clear agent selection when project changes
      };

    case 'SELECT_CREW':
      return {
        ...state,
        selectedCrew: action.payload,
        selectedAgent: null, // Clear agent selection when crew changes
      };

    case 'SELECT_AGENT':
      return {
        ...state,
        selectedAgent: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {
          projects: null,
          crews: null,
          agents: null,
        },
      };

    case 'RESET_SELECTIONS':
      return {
        ...state,
        selectedProject: null,
        selectedCrew: null,
        selectedAgent: null,
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    selectProject: (project: Project | null) => void;
    selectCrew: (crew: Crew | null) => void;
    selectAgent: (agent: Agent | null) => void;
    setLoading: (key: keyof AppState['loading'], value: boolean) => void;
    setError: (key: keyof AppState['errors'], value: string | null) => void;
    clearErrors: () => void;
    resetSelections: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    selectProject: (project: Project | null) =>
      dispatch({ type: 'SELECT_PROJECT', payload: project }),

    selectCrew: (crew: Crew | null) => dispatch({ type: 'SELECT_CREW', payload: crew }),

    selectAgent: (agent: Agent | null) => dispatch({ type: 'SELECT_AGENT', payload: agent }),

    setLoading: (key: keyof AppState['loading'], value: boolean) =>
      dispatch({ type: 'SET_LOADING', payload: { key, value } }),

    setError: (key: keyof AppState['errors'], value: string | null) =>
      dispatch({ type: 'SET_ERROR', payload: { key, value } }),

    clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),

    resetSelections: () => dispatch({ type: 'RESET_SELECTIONS' }),
  };

  return <AppContext.Provider value={{ state, dispatch, actions }}>{children}</AppContext.Provider>;
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Export types
export type { Project, Crew, Agent, AppState, AppAction };
