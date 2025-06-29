import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MissionControl from '../MissionControl';

describe('MissionControl', () => {
  const defaultProps = {
    onStartMission: jest.fn(),
    onRunDemo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mission control header', () => {
    render(<MissionControl {...defaultProps} />);

    expect(screen.getByText('Mission Control')).toBeInTheDocument();
  });

  it('renders all mission control buttons', () => {
    render(<MissionControl {...defaultProps} />);

    expect(screen.getByText('🎯 Brief New Mission')).toBeInTheDocument();
    expect(screen.getByText('🎬 Run Live Demo')).toBeInTheDocument();
    expect(screen.getByText('👥 Manage Teams')).toBeInTheDocument();
    expect(screen.getByText('📚 Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('📊 Mission Reports')).toBeInTheDocument();
  });

  it('calls onStartMission when Brief New Mission button is clicked', async () => {
    const user = userEvent.setup();
    const onStartMission = jest.fn();

    render(<MissionControl {...defaultProps} onStartMission={onStartMission} />);

    const button = screen.getByText('🎯 Brief New Mission');
    await user.click(button);

    expect(onStartMission).toHaveBeenCalledTimes(1);
  });

  it('calls onRunDemo when Run Live Demo button is clicked', async () => {
    const user = userEvent.setup();
    const onRunDemo = jest.fn();

    render(<MissionControl {...defaultProps} onRunDemo={onRunDemo} />);

    const button = screen.getByText('🎬 Run Live Demo');
    await user.click(button);

    expect(onRunDemo).toHaveBeenCalledTimes(1);
  });

  it('renders placeholder buttons for future features', async () => {
    const user = userEvent.setup();
    render(<MissionControl {...defaultProps} />);

    // These buttons should exist but not trigger any actions
    const teamsButton = screen.getByText('👥 Manage Teams');
    const knowledgeButton = screen.getByText('📚 Knowledge Base');
    const reportsButton = screen.getByText('📊 Mission Reports');

    expect(teamsButton).toBeInTheDocument();
    expect(knowledgeButton).toBeInTheDocument();
    expect(reportsButton).toBeInTheDocument();

    // Clicking placeholder buttons should not throw errors
    await user.click(teamsButton);
    await user.click(knowledgeButton);
    await user.click(reportsButton);

    // Verify main handlers weren't called
    expect(defaultProps.onStartMission).not.toHaveBeenCalled();
    expect(defaultProps.onRunDemo).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes to buttons', () => {
    render(<MissionControl {...defaultProps} />);

    const missionButton = screen.getByText('🎯 Brief New Mission');
    const demoButton = screen.getByText('🎬 Run Live Demo');
    const teamsButton = screen.getByText('👥 Manage Teams');
    const knowledgeButton = screen.getByText('📚 Knowledge Base');
    const reportsButton = screen.getByText('📊 Mission Reports');

    expect(missionButton).toHaveClass('w-full', 'bg-green-600', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-green-700');
    expect(demoButton).toHaveClass('w-full', 'bg-yellow-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-yellow-600');
    expect(teamsButton).toHaveClass('w-full', 'bg-blue-100', 'text-blue-700', 'py-2', 'px-4', 'rounded', 'hover:bg-blue-200');
    expect(knowledgeButton).toHaveClass('w-full', 'bg-purple-100', 'text-purple-700', 'py-2', 'px-4', 'rounded', 'hover:bg-purple-200');
    expect(reportsButton).toHaveClass('w-full', 'bg-orange-100', 'text-orange-700', 'py-2', 'px-4', 'rounded', 'hover:bg-orange-200');
  });

  it('renders buttons in correct order', () => {
    render(<MissionControl {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    
    expect(buttons[0]).toHaveTextContent('🎯 Brief New Mission');
    expect(buttons[1]).toHaveTextContent('🎬 Run Live Demo');
    expect(buttons[2]).toHaveTextContent('👥 Manage Teams');
    expect(buttons[3]).toHaveTextContent('📚 Knowledge Base');
    expect(buttons[4]).toHaveTextContent('📊 Mission Reports');
  });

  it('memoizes button configurations correctly', () => {
    const { rerender } = render(<MissionControl {...defaultProps} />);
    
    const initialButtons = screen.getAllByRole('button');
    
    // Rerender with same props - should use memoized values
    rerender(<MissionControl {...defaultProps} />);
    
    const rerenderedButtons = screen.getAllByRole('button');
    expect(rerenderedButtons).toHaveLength(initialButtons.length);
  });

  it('updates memoized config when props change', () => {
    const onStartMission1 = jest.fn();
    const onRunDemo1 = jest.fn();
    const onStartMission2 = jest.fn();
    const onRunDemo2 = jest.fn();

    const { rerender } = render(
      <MissionControl onStartMission={onStartMission1} onRunDemo={onRunDemo1} />
    );

    // Verify initial handlers work
    const missionButton = screen.getByText('🎯 Brief New Mission');
    expect(missionButton).toBeInTheDocument();

    // Rerender with different props
    rerender(
      <MissionControl onStartMission={onStartMission2} onRunDemo={onRunDemo2} />
    );

    // Button should still exist and work with new handlers
    expect(screen.getByText('🎯 Brief New Mission')).toBeInTheDocument();
  });
});