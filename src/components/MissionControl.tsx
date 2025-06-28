'use client';

import React, { memo, useMemo } from 'react';

interface MissionControlProps {
  onStartMission: () => void;
  onRunDemo: () => void;
}

const MissionControl = memo(function MissionControl({
  onStartMission,
  onRunDemo,
}: MissionControlProps) {
  // Memoize button configurations for performance
  const buttonConfigs = useMemo(
    () => [
      {
        id: 'mission',
        onClick: onStartMission,
        className: 'w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700',
        text: '🎯 Brief New Mission',
      },
      {
        id: 'demo',
        onClick: onRunDemo,
        className: 'w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600',
        text: '🎬 Run Live Demo',
      },
      {
        id: 'teams',
        onClick: () => {}, // Placeholder
        className: 'w-full bg-blue-100 text-blue-700 py-2 px-4 rounded hover:bg-blue-200',
        text: '👥 Manage Teams',
      },
      {
        id: 'knowledge',
        onClick: () => {}, // Placeholder
        className: 'w-full bg-purple-100 text-purple-700 py-2 px-4 rounded hover:bg-purple-200',
        text: '📚 Knowledge Base',
      },
      {
        id: 'reports',
        onClick: () => {}, // Placeholder
        className: 'w-full bg-orange-100 text-orange-700 py-2 px-4 rounded hover:bg-orange-200',
        text: '📊 Mission Reports',
      },
    ],
    [onStartMission, onRunDemo]
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Mission Control</h2>

      <div className="space-y-3">
        {buttonConfigs.map(config => (
          <MissionButton
            key={config.id}
            onClick={config.onClick}
            className={config.className}
            text={config.text}
          />
        ))}
      </div>
    </div>
  );
});

// Memoized button component
interface MissionButtonProps {
  onClick: () => void;
  className: string;
  text: string;
}

const MissionButton = memo(function MissionButton({
  onClick,
  className,
  text,
}: MissionButtonProps) {
  return (
    <button onClick={onClick} className={className}>
      {text}
    </button>
  );
});

export default MissionControl;
