import { useState, useEffect, useCallback } from 'react';
import { api, APIError, NetworkError, checkBackendConnection } from '@/config/api';

// Generic API Hook
export function useAPI<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (
    apiCall: () => Promise<{ data: T }>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      setData(response.data);
      onSuccess?.(response.data);
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof APIError) {
        errorMessage = `Server Error: ${error.message}`;
      } else if (error instanceof NetworkError) {
        errorMessage = `Network Error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, request, reset };
}

// Backend Connection Hook
export function useBackendConnection() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const online = await checkBackendConnection();
      setIsOnline(online);
      setLastChecked(new Date());
    } catch {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  }, []);

  // Check connection on mount and periodically
  useEffect(() => {
    checkConnection();
    
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isOnline, lastChecked, checking, checkConnection };
}

// Project-specific hooks
export function useProjects() {
  const { data, loading, error, request, reset } = useAPI<any[]>();

  const loadProjects = useCallback(() => {
    return request(() => api.get('/api/v1/projects'));
  }, [request]);

  const createProject = useCallback((projectData: { name: string; description?: string }) => {
    return request(() => api.post('/api/v1/projects', projectData));
  }, [request]);

  const deleteProject = useCallback((id: number) => {
    return request(() => api.delete(`/api/v1/projects/${id}`));
  }, [request]);

  return {
    projects: data || [],
    loading,
    error,
    loadProjects,
    createProject,
    deleteProject,
    reset,
  };
}

export function useCrews(projectId?: number) {
  const { data, loading, error, request, reset } = useAPI<any[]>();

  const loadCrews = useCallback(() => {
    const url = projectId ? `/api/v1/crews?project_id=${projectId}` : '/api/v1/crews';
    return request(() => api.get(url));
  }, [request, projectId]);

  const createCrew = useCallback((crewData: { 
    project_id: number; 
    name: string; 
    description?: string; 
    crew_type?: string; 
  }) => {
    return request(() => api.post('/api/v1/crews', crewData));
  }, [request]);

  const deleteCrew = useCallback((id: number) => {
    return request(() => api.delete(`/api/v1/crews/${id}`));
  }, [request]);

  return {
    crews: data || [],
    loading,
    error,
    loadCrews,
    createCrew,
    deleteCrew,
    reset,
  };
}

export function useAgents(crewId?: number) {
  const { data, loading, error, request, reset } = useAPI<any[]>();

  const loadAgents = useCallback(() => {
    const url = crewId ? `/api/v1/agents?crew_id=${crewId}` : '/api/v1/agents';
    return request(() => api.get(url));
  }, [request, crewId]);

  const createAgent = useCallback((agentData: {
    crew_id: number;
    name: string;
    role: string;
    goal?: string;
    backstory?: string;
  }) => {
    return request(() => api.post('/api/v1/agents', agentData));
  }, [request]);

  const deleteAgent = useCallback((id: number) => {
    return request(() => api.delete(`/api/v1/agents/${id}`));
  }, [request]);

  return {
    agents: data || [],
    loading,
    error,
    loadAgents,
    createAgent,
    deleteAgent,
    reset,
  };
}

export function useTasks(crewId?: number) {
  const { data, loading, error, request, reset } = useAPI<any[]>();

  const loadTasks = useCallback(() => {
    const url = crewId ? `/api/v1/tasks?crew_id=${crewId}` : '/api/v1/tasks';
    return request(() => api.get(url));
  }, [request, crewId]);

  const createTask = useCallback((taskData: {
    crew_id: number;
    agent_id?: number;
    name: string;
    description?: string;
    priority?: number;
  }) => {
    return request(() => api.post('/api/v1/tasks', taskData));
  }, [request]);

  const updateTask = useCallback((id: number, updateData: any) => {
    return request(() => api.put(`/api/v1/tasks/${id}`, updateData));
  }, [request]);

  const executeTask = useCallback((id: number) => {
    return request(() => api.post(`/api/v1/tasks/${id}/execute`));
  }, [request]);

  return {
    tasks: data || [],
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    executeTask,
    reset,
  };
}

export function useRAG() {
  const { data, loading, error, request, reset } = useAPI<any>();

  const searchRAG = useCallback((searchData: {
    query: string;
    level?: string;
    project_id?: number;
    crew_id?: number;
    agent_id?: number;
    top_k?: number;
  }) => {
    return request(() => api.post('/api/v1/rag/search', searchData));
  }, [request]);

  const addKnowledge = useCallback((knowledgeData: {
    level: string;
    name: string;
    content: string;
    project_id?: number;
    crew_id?: number;
    agent_id?: number;
  }) => {
    return request(() => api.post('/api/v1/rag/stores', knowledgeData));
  }, [request]);

  const getRAGStats = useCallback(() => {
    return request(() => api.get('/api/v1/rag/stats'));
  }, [request]);

  return {
    results: data,
    loading,
    error,
    searchRAG,
    addKnowledge,
    getRAGStats,
    reset,
  };
}