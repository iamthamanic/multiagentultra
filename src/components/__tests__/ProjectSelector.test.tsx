import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectSelector from '../ProjectSelector';

const mockProjects = [
  {
    id: 1,
    name: 'Test Project 1',
    description: 'Test description 1',
    status: 'active',
    created_at: '2024-01-01',
  },
  {
    id: 2,
    name: 'Test Project 2',
    description: 'Test description 2',
    status: 'inactive',
    created_at: '2024-01-02',
  },
];

describe('ProjectSelector', () => {
  const defaultProps = {
    projects: mockProjects,
    loading: false,
    selectedProject: null,
    onSelectProject: jest.fn(),
    onCreateProject: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project list correctly', () => {
    render(<ProjectSelector {...defaultProps} />);

    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ProjectSelector {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
  });

  it('shows empty state when no projects', () => {
    render(<ProjectSelector {...defaultProps} projects={[]} />);

    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
  });

  it('calls onSelectProject when project is clicked', async () => {
    const user = userEvent.setup();
    const onSelectProject = jest.fn();

    render(<ProjectSelector {...defaultProps} onSelectProject={onSelectProject} />);

    await user.click(screen.getByText('Test Project 1'));

    expect(onSelectProject).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('calls onCreateProject when new project button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateProject = jest.fn();

    render(<ProjectSelector {...defaultProps} onCreateProject={onCreateProject} />);

    await user.click(screen.getByText('+ New Project'));

    expect(onCreateProject).toHaveBeenCalled();
  });

  it('highlights selected project', () => {
    render(<ProjectSelector {...defaultProps} selectedProject={mockProjects[0]} />);

    const selectedProject = screen.getByText('Test Project 1').closest('div');
    expect(selectedProject).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('shows project status with correct styling', () => {
    render(<ProjectSelector {...defaultProps} />);

    const activeStatus = screen.getByText('active');
    const inactiveStatus = screen.getByText('inactive');

    expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');
    expect(inactiveStatus).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('displays project IDs', () => {
    render(<ProjectSelector {...defaultProps} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });
});
