"use client";

import { useState, useEffect } from "react";
import { useBackendConnection, useProjects, useCrews, useAgents } from "@/hooks/useAPI";

interface Project {
  id: number;
  name: string;
  status: string;
}

interface Crew {
  id: number;
  name: string;
  project_id: number;
  status: string;
}

interface Agent {
  id: number;
  name: string;
  crew_id: number;
  role: string;
}

export default function Dashboard() {
  const { isOnline } = useBackendConnection();
  const { projects, loading: projectsLoading, error: projectsError, loadProjects } = useProjects();
  const { crews, loading: crewsLoading, loadCrews } = useCrews();
  const { agents, loading: agentsLoading, loadAgents } = useAgents();

  const [stats, setStats] = useState({
    projects: 0,
    crews: 0,
    agents: 0,
    activeTasks: 0
  });

  // Load data on mount
  useEffect(() => {
    loadProjects();
    loadCrews();
    loadAgents();
  }, [loadProjects, loadCrews, loadAgents]);

  // Update stats when data changes
  useEffect(() => {
    setStats({
      projects: projects.length,
      crews: crews.length,
      agents: agents.length,
      activeTasks: crews.filter((c: Crew) => c.status === "active").length
    });
  }, [projects, crews, agents]);

  const recentProjects = projects.slice(0, 3);
  const isLoading = projectsLoading || crewsLoading || agentsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Übersicht über alle MultiAgent Ultra Aktivitäten</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isOnline ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {projectsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Fehler beim Laden der Daten</h3>
              <p className="text-red-600 text-sm">{projectsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">Lade Dashboard-Daten...</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projekte</p>
              <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.crews}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.agents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTasks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Aktuelle Projekte</h3>
        </div>
        <div className="p-6">
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">{project.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600">Projekt #{project.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Keine Projekte vorhanden</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Erstes Projekt erstellen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Schnellaktionen</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">📁</div>
              <p className="font-medium text-gray-900">Neues Projekt</p>
              <p className="text-sm text-gray-600">Erstelle ein neues MultiAgent Projekt</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
              <div className="text-2xl mb-2">👥</div>
              <p className="font-medium text-gray-900">Neue Crew</p>
              <p className="text-sm text-gray-600">Füge eine neue Agent-Crew hinzu</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
              <div className="text-2xl mb-2">🧠</div>
              <p className="font-medium text-gray-900">Knowledge Base</p>
              <p className="text-sm text-gray-600">Verwalte das hierarchische RAG</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}