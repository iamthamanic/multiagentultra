'use client';

import React from 'react';
import { useBatchedStateObject } from '@/hooks/useBatchedState';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: { name: string; description: string }) => Promise<void>;
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [newProject, setNewProject] = useBatchedStateObject({
    name: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!newProject.name.trim()) return;

    await onSubmit(newProject);
    setNewProject({ name: '', description: '' });
  };

  const handleClose = () => {
    setNewProject({ name: '', description: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Project</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={newProject.name}
              onChange={e => setNewProject({ name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., New Landingpage for Firma X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newProject.description}
              onChange={e => setNewProject({ description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
              placeholder="Describe the project goals and requirements..."
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newProject.name.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
