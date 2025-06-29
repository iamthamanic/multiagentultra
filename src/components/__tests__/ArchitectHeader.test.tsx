import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchitectHeader from '../ArchitectHeader';

describe('ArchitectHeader', () => {
  const defaultProps = {
    isOnline: true,
    onStartMission: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header title and subtitle', () => {
    render(<ArchitectHeader {...defaultProps} />);

    expect(screen.getByText('🏗️ Architect Control Center')).toBeInTheDocument();
    expect(screen.getByText('Orchestrate your AI agent teams for complex missions')).toBeInTheDocument();
  });

  it('shows online status when connected', () => {
    render(<ArchitectHeader {...defaultProps} isOnline={true} />);

    expect(screen.getByText('Systems Online')).toBeInTheDocument();
    const statusIndicator = screen.getByText('Systems Online').previousElementSibling;
    expect(statusIndicator).toHaveClass('bg-green-500');
  });

  it('shows offline status when disconnected', () => {
    render(<ArchitectHeader {...defaultProps} isOnline={false} />);

    expect(screen.getByText('Systems Offline')).toBeInTheDocument();
    const statusIndicator = screen.getByText('Systems Offline').previousElementSibling;
    expect(statusIndicator).toHaveClass('bg-red-500');
  });

  it('renders start mission button', () => {
    render(<ArchitectHeader {...defaultProps} />);

    const button = screen.getByRole('button', { name: '🚀 Start New Mission' });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('disables start mission button when disabled prop is true', () => {
    render(<ArchitectHeader {...defaultProps} disabled={true} />);

    const button = screen.getByRole('button', { name: '🚀 Start New Mission' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('calls onStartMission when button is clicked', async () => {
    const user = userEvent.setup();
    const onStartMission = jest.fn();

    render(<ArchitectHeader {...defaultProps} onStartMission={onStartMission} />);

    const button = screen.getByRole('button', { name: '🚀 Start New Mission' });
    await user.click(button);

    expect(onStartMission).toHaveBeenCalledTimes(1);
  });

  it('does not call onStartMission when button is disabled', async () => {
    const user = userEvent.setup();
    const onStartMission = jest.fn();

    render(<ArchitectHeader {...defaultProps} onStartMission={onStartMission} disabled={true} />);

    const button = screen.getByRole('button', { name: '🚀 Start New Mission' });
    await user.click(button);

    expect(onStartMission).not.toHaveBeenCalled();
  });

  it('memoizes connection status correctly', () => {
    const { rerender } = render(<ArchitectHeader {...defaultProps} isOnline={true} />);
    
    expect(screen.getByText('Systems Online')).toBeInTheDocument();

    // Rerender with different online status
    rerender(<ArchitectHeader {...defaultProps} isOnline={false} />);
    
    expect(screen.getByText('Systems Offline')).toBeInTheDocument();
  });

  it('applies correct CSS classes to connection status indicator', () => {
    const { rerender } = render(<ArchitectHeader {...defaultProps} isOnline={true} />);
    
    let statusIndicator = screen.getByText('Systems Online').previousElementSibling;
    expect(statusIndicator).toHaveClass('w-3', 'h-3', 'rounded-full', 'bg-green-500');

    rerender(<ArchitectHeader {...defaultProps} isOnline={false} />);
    
    statusIndicator = screen.getByText('Systems Offline').previousElementSibling;
    expect(statusIndicator).toHaveClass('w-3', 'h-3', 'rounded-full', 'bg-red-500');
  });

  it('applies correct CSS classes to mission button', () => {
    render(<ArchitectHeader {...defaultProps} />);

    const button = screen.getByRole('button', { name: '🚀 Start New Mission' });
    expect(button).toHaveClass(
      'bg-blue-600',
      'text-white',
      'px-4',
      'py-2',
      'rounded-lg',
      'hover:bg-blue-700',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    );
  });
});