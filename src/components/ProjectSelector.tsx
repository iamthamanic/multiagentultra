'use client';

import React, { memo, useMemo } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  loading: boolean;
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

const ProjectSelector = memo(function ProjectSelector({
  projects,
  loading,
  selectedProject,
  onSelectProject,
  onCreateProject,
}: ProjectSelectorProps) {
  // Memoize sorted projects for performance
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // Sort by status (active first), then by name
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Active Projects</h2>
        <button onClick={onCreateProject} className="text-blue-600 hover:text-blue-800 text-sm">
          + New Project
        </button>
      </div>

      {loading ? (
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
          {sortedProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id}
              onSelect={onSelectProject}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Memoized project card component
interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: (project: Project) => void;
}

const ProjectCard = memo(function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
  const handleClick = () => onSelect(project);

  const cardClassName = useMemo(() => {
    return `p-3 rounded-lg cursor-pointer transition-colors ${
      isSelected
        ? 'bg-blue-50 border-2 border-blue-200'
        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
    }`;
  }, [isSelected]);

  const statusClassName = useMemo(() => {
    return `px-2 py-1 rounded text-xs ${
      project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`;
  }, [project.status]);

  return (
    <div className={cardClassName} onClick={handleClick}>
      <h3 className="font-medium">{project.name}</h3>
      {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
      <div className="flex justify-between items-center mt-2">
        <span className={statusClassName}>{project.status}</span>
        <span className="text-xs text-gray-500">#{project.id}</span>
      </div>
    </div>
  );
});

export default ProjectSelector;
