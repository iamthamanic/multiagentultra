'use client';

import React, { memo, useMemo } from 'react';

interface ArchitectHeaderProps {
  isOnline: boolean;
  onStartMission: () => void;
  disabled: boolean;
}

const ArchitectHeader = memo(function ArchitectHeader({
  isOnline,
  onStartMission,
  disabled,
}: ArchitectHeaderProps) {
  // Memoize connection status indicator
  const connectionStatus = useMemo(
    () => ({
      className: `w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`,
      text: isOnline ? 'Systems Online' : 'Systems Offline',
    }),
    [isOnline]
  );

  // Memoize mission button props
  const missionButtonProps = useMemo(
    () => ({
      onClick: onStartMission,
      disabled,
      className:
        'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
    }),
    [onStartMission, disabled]
  );

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏗️ Architect Control Center</h1>
            <p className="text-gray-600">Orchestrate your AI agent teams for complex missions</p>
          </div>

          <div className="flex items-center space-x-4">
            <ConnectionStatus className={connectionStatus.className} text={connectionStatus.text} />

            <MissionButton {...missionButtonProps}>🚀 Start New Mission</MissionButton>
          </div>
        </div>
      </div>
    </div>
  );
});

// Memoized connection status component
interface ConnectionStatusProps {
  className: string;
  text: string;
}

const ConnectionStatus = memo(function ConnectionStatus({
  className,
  text,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={className} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
});

// Memoized mission button component
interface MissionButtonProps {
  onClick: () => void;
  disabled: boolean;
  className: string;
  children: React.ReactNode;
}

const MissionButton = memo(function MissionButton({
  onClick,
  disabled,
  className,
  children,
}: MissionButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
});

export default ArchitectHeader;
