'use client';

import { useState } from 'react';
import Image from 'next/image';
import Dashboard from '@/components/Dashboard';
import ProjectView from '@/components/ProjectView';
import CrewView from '@/components/CrewView';
import AgentView from '@/components/AgentView';
import KnowledgeView from '@/components/KnowledgeView';
import ArchitectView from '@/components/ArchitectView';

type ViewType = 'architect' | 'dashboard' | 'projects' | 'crews' | 'agents' | 'knowledge';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('architect');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center h-20 px-4">
          <div className="flex items-center">
            <Image
              src="/multiagent-ultra-logo.png"
              alt="MultiAgent Ultra Logo"
              width={128}
              height={128}
              className="rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">Backend: http://localhost:8900</div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('architect')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'architect'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🏗️ Architect
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📊 Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('projects')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'projects'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📁 Projekte
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('crews')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'crews'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👥 Crews
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('agents')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'agents'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🤖 Agents
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('knowledge')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'knowledge'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🧠 Knowledge RAG
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'architect' && <ArchitectView />}
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'projects' && (
            <ProjectView onSelectProject={setSelectedProject} selectedProject={selectedProject} />
          )}
          {currentView === 'crews' && (
            <CrewView
              projectId={selectedProject}
              onSelectCrew={setSelectedCrew}
              selectedCrew={selectedCrew}
            />
          )}
          {currentView === 'agents' && <AgentView crewId={selectedCrew} />}
          {currentView === 'knowledge' && <KnowledgeView />}
        </main>
      </div>
    </div>
  );
}
