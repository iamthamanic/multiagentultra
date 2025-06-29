'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '@/config/api';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';

// Use WebSocketMessage type from hook
type LogMessage = WebSocketMessage;

interface LiveLogProps {
  projectId: number;
  className?: string;
  maxMessages?: number;
}

export default function LiveLog({ projectId, className = '', maxMessages = 100 }: LiveLogProps) {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // WebSocket URL
  const wsUrl = projectId ? `${API_CONFIG.WS_URL}?project_id=${projectId}` : null;

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Keep only the last maxMessages
      return newMessages.slice(-maxMessages);
    });
  }, [maxMessages]);

  // Use our robust WebSocket hook
  const {
    isConnected,
    isConnecting,
    error,
    retryCount,
    reconnect
  } = useWebSocket(wsUrl, {
    maxRetries: 5,
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,
    onMessage: handleMessage,
    onConnect: () => {
      console.log(`Connected to live log for project ${projectId}`);
    },
    onDisconnect: () => {
      console.log('WebSocket connection closed');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!logContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setAutoScroll(isAtBottom);
  };

  const clearLogs = () => {
    setMessages([]);
  };

  const getMessageIcon = (type: LogMessage['type']) => {
    switch (type) {
      case 'thought':
        return '💭';
      case 'action':
        return '⚡';
      case 'result':
        return '✅';
      case 'error':
        return '❌';
      case 'milestone':
        return '🎯';
      case 'status':
        return '📡';
      default:
        return '📝';
    }
  };

  const getMessageStyle = (type: LogMessage['type']) => {
    switch (type) {
      case 'thought':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'action':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'result':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'milestone':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'status':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Live Agent Log</h3>
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 rounded text-sm ${
              autoScroll ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
          >
            Clear
          </button>

          <button
            onClick={reconnect}
            disabled={isConnected || isConnecting}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
          >
            Reconnect
          </button>
        </div>
      </div>

      {/* Log Messages */}
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-white"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isConnected ? (
              <>
                <div className="text-4xl mb-2">👂</div>
                <p>Listening for agent activity...</p>
                <p className="text-sm mt-1">
                  Agent thoughts and actions will appear here in real-time
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🔌</div>
                <p>Connecting to live log stream...</p>
              </>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`border rounded-lg p-3 ${getMessageStyle(message.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <span className="text-lg">{getMessageIcon(message.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-sm">
                      {message.agent_name && (
                        <span className="font-medium">{message.agent_name}</span>
                      )}
                      <span className="text-xs opacity-70">{message.type.toUpperCase()}</span>
                    </div>
                    <p className="mt-1">{message.content}</p>

                    {/* Metadata display for milestones */}
                    {message.type === 'milestone' && message.metadata?.requires_review && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                        <span className="font-medium">🔍 Review Required</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>{messages.length} messages</span>
          <span>Project #{projectId}</span>
        </div>
      </div>
    </div>
  );
}
