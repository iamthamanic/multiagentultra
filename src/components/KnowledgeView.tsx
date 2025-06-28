'use client';

import { useState } from 'react';

export default function KnowledgeView() {
  const [activeLevel, setActiveLevel] = useState<'project' | 'crew' | 'agent'>('project');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const ragLevels = [
    {
      id: 'project' as const,
      title: 'Projekt RAG',
      description: 'Globales Wissen für das gesamte Projekt',
      icon: '🌐',
      color: 'blue',
      examples: [
        'Projektdokumentation',
        'Technische Vorgaben',
        'Design-System',
        'API-Spezifikationen',
      ],
    },
    {
      id: 'crew' as const,
      title: 'Crew RAG',
      description: 'Team-spezifisches Wissen',
      icon: '👥',
      color: 'green',
      examples: ['Team-Guidelines', 'Coding-Standards', 'Workflow-Prozesse', 'Tools & Frameworks'],
    },
    {
      id: 'agent' as const,
      title: 'Agent RAG',
      description: 'Aufgaben-spezifisches Wissen',
      icon: '🤖',
      color: 'purple',
      examples: ['Task-Instructions', 'Code-Snippets', 'Beispiel-Outputs', 'Debugging-Guides'],
    },
  ];

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border') => {
    const colorMap = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Knowledge RAG</h2>
        <p className="text-gray-600">Verwalte das hierarchische Wissens-System für deine Agents</p>
      </div>

      {/* RAG Level Selector */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">RAG Hierarchie</h3>
          <p className="text-gray-600">Wähle die Wissens-Ebene zum Bearbeiten</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ragLevels.map(level => (
              <button
                key={level.id}
                onClick={() => setActiveLevel(level.id)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  activeLevel === level.id
                    ? `${getColorClasses(level.color, 'border')} ${getColorClasses(level.color, 'bg')}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{level.icon}</span>
                  <h4
                    className={`font-semibold ${
                      activeLevel === level.id
                        ? getColorClasses(level.color, 'text')
                        : 'text-gray-900'
                    }`}
                  >
                    {level.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                <div className="space-y-1">
                  {level.examples.slice(0, 2).map((example, idx) => (
                    <div key={idx} className="text-xs text-gray-500">
                      • {example}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Level Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{ragLevels.find(l => l.id === activeLevel)?.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {ragLevels.find(l => l.id === activeLevel)?.title} verwalten
              </h3>
              <p className="text-gray-600">
                {ragLevels.find(l => l.id === activeLevel)?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dokumente hochladen
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.txt,.md,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Dateien hier ablegen oder klicken
                    </p>
                    <p className="text-gray-600">PDF, TXT, MD, DOCX unterstützt</p>
                  </div>
                </div>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Ausgewählte Dateien ({selectedFiles.length}):
                </p>
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Dateien verarbeiten
                </button>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Direkteingabe</label>
            <textarea
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Füge ${activeLevel === 'project' ? 'projekt-spezifisches' : activeLevel === 'crew' ? 'crew-spezifisches' : 'agent-spezifisches'} Wissen hier ein...`}
            />
            <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Text hinzufügen
            </button>
          </div>

          {/* Existing Knowledge */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Vorhandenes Wissen (0 Einträge)
            </h4>
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🧠</div>
              <p>Noch kein Wissen für diese Ebene vorhanden</p>
            </div>
          </div>
        </div>
      </div>

      {/* RAG Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dokumente</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vektoren</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧮</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Speicher</p>
              <p className="text-2xl font-bold text-gray-900">0 MB</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💾</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
