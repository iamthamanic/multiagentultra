'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBackendConnection, useProjects } from '@/hooks/useAPI';
import { api, API_CONFIG, API_ENDPOINTS } from '@/config/api';
import LiveLog from './LiveLog';
import ArchitectHeader from './ArchitectHeader';
import ProjectSelector from './ProjectSelector';
import MissionControl from './MissionControl';
import CreateProjectModal from './CreateProjectModal';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const ArchitectView = React.memo(function ArchitectView() {
  const { isOnline } = useBackendConnection();
  const { projects, loading: projectsLoading, loadProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const handleCreateProject = useCallback(
    async (projectData: { name: string; description: string }) => {
      try {
        await api.post(API_ENDPOINTS.projects, {
          name: projectData.name.trim(),
          description: projectData.description.trim() || undefined,
        });

        setShowCreateProject(false);
        await loadProjects();
      } catch (error) {
        console.error('Failed to create project:', error);
      }
    },
    [loadProjects]
  );

  const startNewMission = useCallback(() => {
    if (!selectedProject) return;

    console.log('Starting new mission for project:', selectedProject.name);
    alert(`Mission briefing for "${selectedProject.name}" - Feature coming soon!`);
  }, [selectedProject]);

  const runDemo = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const demoEndpoint = `${API_CONFIG.BASE_URL}/api/v1/demo/demo-agent-activity/${selectedProject.id}`;
      await api.post(demoEndpoint);
    } catch (error) {
      console.error('Failed to run demo:', error);
    }
  }, [selectedProject]);

  // Memoize header props for performance
  const headerProps = useMemo(
    () => ({
      isOnline,
      onStartMission: startNewMission,
      disabled: !selectedProject || !isOnline,
    }),
    [isOnline, startNewMission, selectedProject]
  );

  // Memoize empty state content
  const emptyStateContent = useMemo(
    () => (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🎛️</div>
          <h3 className="text-xl font-medium mb-2">Select a Project</h3>
          <p>Choose a project from the left panel to view live agent activity</p>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ArchitectHeader {...headerProps} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Project Selection & Control */}
          <div className="lg:col-span-1 space-y-6">
            <ProjectSelector
              projects={projects}
              loading={projectsLoading}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              onCreateProject={() => setShowCreateProject(true)}
            />

            {selectedProject && (
              <MissionControl onStartMission={startNewMission} onRunDemo={runDemo} />
            )}
          </div>

          {/* Right Panel - Live Log */}
          <div className="lg:col-span-2">
            {selectedProject ? <LiveLogPanel projectId={selectedProject.id} /> : emptyStateContent}
          </div>
        </div>
      </div>

      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
});

// Memoized LiveLog panel component
interface LiveLogPanelProps {
  projectId: number;
}

const LiveLogPanel = React.memo(function LiveLogPanel({ projectId }: LiveLogPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow h-full">
      <LiveLog projectId={projectId} className="h-full" />
    </div>
  );
});

export default ArchitectView;
