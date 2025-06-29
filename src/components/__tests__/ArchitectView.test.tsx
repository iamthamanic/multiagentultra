import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchitectView from '../ArchitectView';

// Mock the hooks
jest.mock('@/hooks/useAPI', () => ({
  useBackendConnection: () => ({ isOnline: true }),
  useProjects: () => ({
    projects: [
      { id: 1, name: 'Test Project 1', description: 'Description 1', status: 'active', created_at: '2024-01-01' },
      { id: 2, name: 'Test Project 2', description: 'Description 2', status: 'inactive', created_at: '2024-01-02' },
    ],
    loading: false,
    loadProjects: jest.fn(),
  }),
}));

// Mock the API
jest.mock('@/config/api', () => ({
  api: {
    post: jest.fn().mockResolvedValue({ data: { id: 3, name: 'New Project' } }),
  },
  API_CONFIG: {
    BASE_URL: 'http://localhost:8888',
  },
  API_ENDPOINTS: {
    projects: '/api/v1/projects',
  },
}));

// Mock LiveLog component
jest.mock('../LiveLog', () => {
  return function MockLiveLog({ projectId, className }: { projectId: number; className: string }) {
    return <div data-testid="live-log" data-project-id={projectId} className={className}>Live Log for Project {projectId}</div>;
  };
});

// Mock child components
jest.mock('../ArchitectHeader', () => {
  return function MockArchitectHeader({ isOnline, onStartMission, disabled }: any) {
    return (
      <div data-testid="architect-header">
        <span>Header - Online: {isOnline.toString()}</span>
        <button onClick={onStartMission} disabled={disabled}>Start Mission</button>
      </div>
    );
  };
});

jest.mock('../ProjectSelector', () => {
  return function MockProjectSelector({ projects, loading, selectedProject, onSelectProject, onCreateProject }: any) {
    return (
      <div data-testid="project-selector">
        {loading ? (
          <span>Loading...</span>
        ) : (
          <>
            {projects.map((project: any) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project)}
                data-selected={selectedProject?.id === project.id}
              >
                {project.name}
              </button>
            ))}
            <button onClick={onCreateProject}>Create Project</button>
          </>
        )}
      </div>
    );
  };
});

jest.mock('../MissionControl', () => {
  return function MockMissionControl({ onStartMission, onRunDemo }: any) {
    return (
      <div data-testid="mission-control">
        <button onClick={onStartMission}>Start Mission</button>
        <button onClick={onRunDemo}>Run Demo</button>
      </div>
    );
  };
});

jest.mock('../CreateProjectModal', () => {
  return function MockCreateProjectModal({ isOpen, onClose, onSubmit }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="create-project-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ name: 'New Project', description: 'New Description' })}>
          Submit
        </button>
      </div>
    );
  };
});

describe('ArchitectView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main layout components', () => {
    render(<ArchitectView />);

    expect(screen.getByTestId('architect-header')).toBeInTheDocument();
    expect(screen.getByTestId('project-selector')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('auto-selects first project when none selected', async () => {
    render(<ArchitectView />);

    await waitFor(() => {
      expect(screen.getByTestId('mission-control')).toBeInTheDocument();
    });

    // First project should be auto-selected, so mission control should show
    expect(screen.getByTestId('live-log')).toBeInTheDocument();
  });

  it('shows empty state when no project selected', () => {
    // Mock useProjects to return empty array initially
    jest.doMock('@/hooks/useAPI', () => ({
      useBackendConnection: () => ({ isOnline: true }),
      useProjects: () => ({
        projects: [],
        loading: false,
        loadProjects: jest.fn(),
      }),
    }));

    render(<ArchitectView />);

    expect(screen.getByText('Select a Project')).toBeInTheDocument();
    expect(screen.getByText('Choose a project from the left panel to view live agent activity')).toBeInTheDocument();
  });

  it('opens create project modal when create button clicked', async () => {
    const user = userEvent.setup();
    render(<ArchitectView />);

    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
  });

  it('closes create project modal when close button clicked', async () => {
    const user = userEvent.setup();
    render(<ArchitectView />);

    // Open modal
    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(screen.queryByTestId('create-project-modal')).not.toBeInTheDocument();
  });

  it('handles project creation', async () => {
    const user = userEvent.setup();
    const { api } = require('@/config/api');
    
    render(<ArchitectView />);

    // Open modal
    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    // Submit form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    expect(api.post).toHaveBeenCalledWith('/api/v1/projects', {
      name: 'New Project',
      description: 'New Description',
    });

    await waitFor(() => {
      expect(screen.queryByTestId('create-project-modal')).not.toBeInTheDocument();
    });
  });

  it('handles start mission action', async () => {
    const user = userEvent.setup();
    
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<ArchitectView />);

    await waitFor(() => {
      expect(screen.getByTestId('mission-control')).toBeInTheDocument();
    });

    const startMissionButton = screen.getAllByText('Start Mission')[0]; // Get first one from header
    await user.click(startMissionButton);

    expect(alertSpy).toHaveBeenCalledWith('Mission briefing for "Test Project 1" - Feature coming soon!');
    
    alertSpy.mockRestore();
  });

  it('handles demo run action', async () => {
    const user = userEvent.setup();
    const { api } = require('@/config/api');
    
    render(<ArchitectView />);

    await waitFor(() => {
      expect(screen.getByTestId('mission-control')).toBeInTheDocument();
    });

    const runDemoButton = screen.getByText('Run Demo');
    await user.click(runDemoButton);

    expect(api.post).toHaveBeenCalledWith('http://localhost:8888/api/v1/demo/demo-agent-activity/1');
  });

  it('switches between projects correctly', async () => {
    const user = userEvent.setup();
    render(<ArchitectView />);

    // Initially first project should be selected
    await waitFor(() => {
      expect(screen.getByTestId('live-log')).toHaveAttribute('data-project-id', '1');
    });

    // Click on second project
    const project2Button = screen.getByText('Test Project 2');
    await user.click(project2Button);

    await waitFor(() => {
      expect(screen.getByTestId('live-log')).toHaveAttribute('data-project-id', '2');
    });
  });

  it('memoizes header props correctly', () => {
    const { rerender } = render(<ArchitectView />);
    
    expect(screen.getByTestId('architect-header')).toBeInTheDocument();
    expect(screen.getByText('Header - Online: true')).toBeInTheDocument();

    // Rerender should not cause issues
    rerender(<ArchitectView />);
    expect(screen.getByTestId('architect-header')).toBeInTheDocument();
  });

  it('memoizes empty state content', () => {
    // Mock to return no projects
    jest.doMock('@/hooks/useAPI', () => ({
      useBackendConnection: () => ({ isOnline: true }),
      useProjects: () => ({
        projects: [],
        loading: false,
        loadProjects: jest.fn(),
      }),
    }));

    const { rerender } = render(<ArchitectView />);
    
    expect(screen.getByText('Select a Project')).toBeInTheDocument();

    // Rerender should show same content
    rerender(<ArchitectView />);
    expect(screen.getByText('Select a Project')).toBeInTheDocument();
  });

  it('handles errors in project creation gracefully', async () => {
    const user = userEvent.setup();
    const { api } = require('@/config/api');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make API call fail
    api.post.mockRejectedValueOnce(new Error('API Error'));
    
    render(<ArchitectView />);

    // Open modal and submit
    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create project:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles errors in demo run gracefully', async () => {
    const user = userEvent.setup();
    const { api } = require('@/config/api');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make API call fail
    api.post.mockRejectedValueOnce(new Error('Demo API Error'));
    
    render(<ArchitectView />);

    await waitFor(() => {
      expect(screen.getByTestId('mission-control')).toBeInTheDocument();
    });

    const runDemoButton = screen.getByText('Run Demo');
    await user.click(runDemoButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to run demo:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});