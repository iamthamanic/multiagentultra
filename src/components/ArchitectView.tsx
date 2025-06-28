'use client';

import { useState, useEffect } from 'react';
import { useBackendConnection, useProjects } from '@/hooks/useAPI';
import { api, API_CONFIG, API_ENDPOINTS } from '@/config/api';
import LiveLog from './LiveLog';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export default function ArchitectView() {
  const { isOnline } = useBackendConnection();
  const { projects, loading: projectsLoading, loadProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      // ✅ FIXED: Proper API implementation using centralized config
      await api.post(API_ENDPOINTS.projects, {
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
      });

      setShowCreateProject(false);
      setNewProject({ name: '', description: '' });
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      // TODO: Add proper error handling UI (toast/modal)
    }
  };

  const startNewMission = () => {
    if (!selectedProject) return;

    // ✅ FIXED: Proper implementation placeholder
    console.log('Starting new mission for project:', selectedProject.name);
    // TODO: Implement mission briefing modal with crew selection
    alert(`Mission briefing for "${selectedProject.name}" - Feature coming soon!`);
  };

  const runDemo = async () => {
    if (!selectedProject) return;

    try {
      // ✅ FIXED: Use centralized API configuration
      const demoEndpoint = `${API_CONFIG.BASE_URL}/api/v1/demo/demo-agent-activity/${selectedProject.id}`;
      await api.post(demoEndpoint);
    } catch (error) {
      console.error('Failed to run demo:', error);
      // TODO: Add proper error handling UI
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏗️ Architect Control Center</h1>
              <p className="text-gray-600">Orchestrate your AI agent teams for complex missions</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Systems Online' : 'Systems Offline'}
                </span>
              </div>

              {/* New Mission Button */}
              <button
                onClick={startNewMission}
                disabled={!selectedProject || !isOnline}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Start New Mission
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Project Selection & Control */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Selector */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Active Projects</h2>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + New Project
                </button>
              </div>

              {projectsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📂</div>
                  <p>No projects yet</p>
                  <p className="text-sm mt-1">Create your first project to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedProject?.id === project.id
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <h3 className="font-medium">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            project.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status}
                        </span>
                        <span className="text-xs text-gray-500">#{project.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mission Control */}
            {selectedProject && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Mission Control</h2>

                <div className="space-y-3">
                  <button
                    onClick={startNewMission}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    🎯 Brief New Mission
                  </button>

                  <button
                    onClick={runDemo}
                    className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
                  >
                    🎬 Run Live Demo
                  </button>

                  <button className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded hover:bg-blue-200">
                    👥 Manage Teams
                  </button>

                  <button className="w-full bg-purple-100 text-purple-700 py-2 px-4 rounded hover:bg-purple-200">
                    📚 Knowledge Base
                  </button>

                  <button className="w-full bg-orange-100 text-orange-700 py-2 px-4 rounded hover:bg-orange-200">
                    📊 Mission Reports
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Live Log */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="bg-white rounded-lg shadow h-full">
                <LiveLog projectId={selectedProject.id} className="h-full" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🎛️</div>
                  <h3 className="text-xl font-medium mb-2">Select a Project</h3>
                  <p>Choose a project from the left panel to view live agent activity</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., New Landingpage for Firma X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="Describe the project goals and requirements..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateProject(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
