"use client";

import { useState, useEffect } from "react";

interface Agent {
  id: number;
  name: string;
  crew_id: number;
  role: string;
}

interface AgentViewProps {
  crewId: number | null;
}

export default function AgentView({ crewId }: AgentViewProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, [crewId]);

  const loadAgents = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/v1/agents");
      const data = await response.json();
      // Filter by crew if crewId is provided
      const filteredAgents = crewId 
        ? data.filter((agent: Agent) => agent.crew_id === crewId)
        : data;
      setAgents(filteredAgents);
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!crewId) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🤖</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine Crew ausgewählt
        </h3>
        <p className="text-gray-600">
          Bitte wähle zuerst eine Crew aus, um deren Agents zu verwalten
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Agents...</div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'researcher': return '🔍';
      case 'developer': return '💻';
      case 'analyst': return '📊';
      case 'writer': return '✍️';
      default: return '🤖';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'researcher': return 'bg-blue-100 text-blue-700';
      case 'developer': return 'bg-green-100 text-green-700';
      case 'analyst': return 'bg-purple-100 text-purple-700';
      case 'writer': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agents</h2>
          <p className="text-gray-600">
            Verwalte die KI-Agents für Crew #{crewId}
          </p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          + Neuer Agent
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">
                  {getRoleIcon(agent.role)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(agent.role)}`}>
                {agent.role}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {agent.name}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Agent ID:</span>
                <span className="font-medium">#{agent.id}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  Ready
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tasks:</span>
                <span className="font-medium">0 aktiv</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                Konfigurieren
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors">
                Logs
              </button>
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {agents.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Agents vorhanden
              </h3>
              <p className="text-gray-600 mb-6">
                Erstelle den ersten Agent für diese Crew
              </p>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Ersten Agent erstellen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Agent Templates */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Agent Templates</h3>
          <p className="text-gray-600">Verwende vorgefertigte Agent-Konfigurationen</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">🔍</div>
              <p className="font-medium text-gray-900">Research Agent</p>
              <p className="text-xs text-gray-600">Informationen sammeln</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
              <div className="text-2xl mb-2">💻</div>
              <p className="font-medium text-gray-900">Code Agent</p>
              <p className="text-xs text-gray-600">Code schreiben & debuggen</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium text-gray-900">Analysis Agent</p>
              <p className="text-xs text-gray-600">Daten analysieren</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center">
              <div className="text-2xl mb-2">✍️</div>
              <p className="font-medium text-gray-900">Writer Agent</p>
              <p className="text-xs text-gray-600">Content erstellen</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}