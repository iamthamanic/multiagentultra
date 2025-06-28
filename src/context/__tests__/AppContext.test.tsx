import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext, Project, Crew, Agent } from '../AppContext';

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  description: 'Test Description',
  status: 'active',
  created_at: '2024-01-01',
};

const mockCrew: Crew = {
  id: 1,
  name: 'Test Crew',
  project_id: 1,
  status: 'active',
};

const mockAgent: Agent = {
  id: 1,
  name: 'Test Agent',
  crew_id: 1,
  status: 'active',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  it('should provide initial state', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.state).toEqual({
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
    });
  });

  it('should select project and clear dependent selections', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    // First select crew and agent
    act(() => {
      result.current.actions.selectCrew(mockCrew);
      result.current.actions.selectAgent(mockAgent);
    });

    // Then select project - should clear crew and agent
    act(() => {
      result.current.actions.selectProject(mockProject);
    });

    expect(result.current.state.selectedProject).toEqual(mockProject);
    expect(result.current.state.selectedCrew).toBeNull();
    expect(result.current.state.selectedAgent).toBeNull();
  });

  it('should select crew and clear agent selection', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    // First select agent
    act(() => {
      result.current.actions.selectAgent(mockAgent);
    });

    // Then select crew - should clear agent
    act(() => {
      result.current.actions.selectCrew(mockCrew);
    });

    expect(result.current.state.selectedCrew).toEqual(mockCrew);
    expect(result.current.state.selectedAgent).toBeNull();
  });

  it('should select agent without affecting other selections', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.actions.selectProject(mockProject);
      result.current.actions.selectCrew(mockCrew);
      result.current.actions.selectAgent(mockAgent);
    });

    expect(result.current.state.selectedProject).toEqual(mockProject);
    expect(result.current.state.selectedCrew).toEqual(mockCrew);
    expect(result.current.state.selectedAgent).toEqual(mockAgent);
  });

  it('should manage loading states', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.actions.setLoading('projects', true);
    });

    expect(result.current.state.loading.projects).toBe(true);
    expect(result.current.state.loading.crews).toBe(false);
    expect(result.current.state.loading.agents).toBe(false);

    act(() => {
      result.current.actions.setLoading('projects', false);
      result.current.actions.setLoading('crews', true);
    });

    expect(result.current.state.loading.projects).toBe(false);
    expect(result.current.state.loading.crews).toBe(true);
  });

  it('should manage error states', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.actions.setError('projects', 'Project error');
    });

    expect(result.current.state.errors.projects).toBe('Project error');
    expect(result.current.state.errors.crews).toBeNull();

    act(() => {
      result.current.actions.setError('crews', 'Crew error');
    });

    expect(result.current.state.errors.projects).toBe('Project error');
    expect(result.current.state.errors.crews).toBe('Crew error');
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.actions.setError('projects', 'Project error');
      result.current.actions.setError('crews', 'Crew error');
      result.current.actions.setError('agents', 'Agent error');
    });

    expect(result.current.state.errors.projects).toBe('Project error');
    expect(result.current.state.errors.crews).toBe('Crew error');
    expect(result.current.state.errors.agents).toBe('Agent error');

    act(() => {
      result.current.actions.clearErrors();
    });

    expect(result.current.state.errors.projects).toBeNull();
    expect(result.current.state.errors.crews).toBeNull();
    expect(result.current.state.errors.agents).toBeNull();
  });

  it('should reset all selections', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });

    act(() => {
      result.current.actions.selectProject(mockProject);
      result.current.actions.selectCrew(mockCrew);
      result.current.actions.selectAgent(mockAgent);
    });

    expect(result.current.state.selectedProject).toEqual(mockProject);
    expect(result.current.state.selectedCrew).toEqual(mockCrew);
    expect(result.current.state.selectedAgent).toEqual(mockAgent);

    act(() => {
      result.current.actions.resetSelections();
    });

    expect(result.current.state.selectedProject).toBeNull();
    expect(result.current.state.selectedCrew).toBeNull();
    expect(result.current.state.selectedAgent).toBeNull();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');

    console.error = originalError;
  });
});
