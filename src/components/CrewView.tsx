"use client";

import { useState, useEffect } from "react";

interface Crew {
  id: number;
  name: string;
  project_id: number;
  status: string;
}

interface CrewViewProps {
  projectId: number | null;
  onSelectCrew: (crewId: number | null) => void;
  selectedCrew: number | null;
}

export default function CrewView({ projectId, onSelectCrew, selectedCrew }: CrewViewProps) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrews();
  }, [projectId]);

  const loadCrews = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/v1/crews");
      const data = await response.json();
      // Filter by project if projectId is provided
      const filteredCrews = projectId 
        ? data.filter((crew: Crew) => crew.project_id === projectId)
        : data;
      setCrews(filteredCrews);
    } catch (error) {
      console.error("Failed to load crews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">👥</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Kein Projekt ausgewählt
        </h3>
        <p className="text-gray-600">
          Bitte wähle zuerst ein Projekt aus, um dessen Crews zu verwalten
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Crews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crews</h2>
          <p className="text-gray-600">
            Verwalte die Agent-Teams für Projekt #{projectId}
          </p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          + Neue Crew
        </button>
      </div>

      {/* Crews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crews.map((crew) => (
          <div
            key={crew.id}
            onClick={() => onSelectCrew(crew.id)}
            className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedCrew === crew.id 
                ? 'ring-2 ring-green-500 border-green-500' 
                : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">👥</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                crew.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {crew.status}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {crew.name}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Crew #{crew.id}</span>
              <div className="flex items-center space-x-2">
                <span>🤖</span>
                <span>0 Agents</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {crews.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Crews vorhanden
              </h3>
              <p className="text-gray-600 mb-6">
                Erstelle die erste Crew für dieses Projekt
              </p>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Erste Crew erstellen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Crew Details */}
      {selectedCrew && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-900">
                  Crew #{selectedCrew} ausgewählt
                </p>
                <p className="text-sm text-green-700">
                  Du kannst jetzt Agents für diese Crew verwalten
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectCrew(null)}
              className="text-green-600 hover:text-green-800"
            >
              Auswahl aufheben
            </button>
          </div>
        </div>
      )}
    </div>
  );
}