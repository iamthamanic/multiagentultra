'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, API_ENDPOINTS } from '@/config/api';

interface Project {
  id: number;
  name: string;
  status: string;
  description?: string;
}

interface ProjectViewProps {
  onSelectProject: (projectId: number | null) => void;
  selectedProject: number | null;
}

export default function ProjectView({ onSelectProject, selectedProject }: ProjectViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const loadProjects = useCallback(async () => {
    try {
      // ✅ FIXED: Use centralized API configuration
      const response = await api.get<Project[]>(API_ENDPOINTS.projects);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      // ✅ FIXED: Use centralized API with proper error handling
      await api.post(API_ENDPOINTS.projects, {
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
      });

      // Reset form and reload data
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      // TODO: Add proper error UI (toast/modal)
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Projekte...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projekte</h2>
          <p className="text-gray-600">Verwalte deine MultiAgent Ultra Projekte</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Neues Projekt
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Neues Projekt erstellen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Projektname</label>
              <input
                type="text"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. E-Commerce Chatbot"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
              <textarea
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Kurze Beschreibung des Projekts..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Erstellen
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedProject === project.id
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {project.status}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>

            {project.description && (
              <p className="text-gray-600 text-sm mb-4">{project.description}</p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Projekt #{project.id}</span>
              <div className="flex items-center space-x-2">
                <span>👥</span>
                <span>0 Crews</span>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📁</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Projekte vorhanden</h3>
              <p className="text-gray-600 mb-6">Erstelle dein erstes MultiAgent Ultra Projekt</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Erstes Projekt erstellen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Project Details */}
      {selectedProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium text-blue-900">Projekt #{selectedProject} ausgewählt</p>
                <p className="text-sm text-blue-700">
                  Du kannst jetzt Crews für dieses Projekt verwalten
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectProject(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              Auswahl aufheben
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
