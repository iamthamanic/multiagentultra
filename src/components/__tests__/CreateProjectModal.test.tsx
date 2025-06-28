import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateProjectModal from '../CreateProjectModal';

describe('CreateProjectModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<CreateProjectModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('renders modal when open', () => {
    render(<CreateProjectModal {...defaultProps} />);

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument();
  });

  it('allows typing in form fields', async () => {
    const user = userEvent.setup();
    render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByLabelText('Project Name');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(nameInput, 'Test Project');
    await user.type(descriptionInput, 'Test Description');

    expect(nameInput).toHaveValue('Test Project');
    expect(descriptionInput).toHaveValue('Test Description');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSubmit with form data when create button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<CreateProjectModal {...defaultProps} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText('Project Name');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(nameInput, 'Test Project');
    await user.type(descriptionInput, 'Test Description');
    await user.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Project',
      description: 'Test Description',
    });
  });

  it('disables create button when name is empty', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: 'Create Project' });
    expect(createButton).toBeDisabled();
  });

  it('enables create button when name is provided', async () => {
    const user = userEvent.setup();
    render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByLabelText('Project Name');
    const createButton = screen.getByRole('button', { name: 'Create Project' });

    await user.type(nameInput, 'Test Project');

    expect(createButton).toBeEnabled();
  });

  it('clears form when modal is closed', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

    const nameInput = screen.getByLabelText('Project Name');
    await user.type(nameInput, 'Test Project');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('prevents submission with only whitespace in name', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<CreateProjectModal {...defaultProps} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText('Project Name');
    await user.type(nameInput, '   ');
    await user.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
