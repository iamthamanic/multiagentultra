import { useRef, useEffect, useCallback, useState } from 'react';

export interface WebSocketMessage {
  type: 'thought' | 'action' | 'result' | 'error' | 'milestone' | 'status';
  agent_id?: number;
  agent_name?: string;
  crew_id?: number;
  project_id?: number;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface UseWebSocketOptions {
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  retryCount: number;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    maxRetries = 5,
    initialRetryDelay = 1000,
    maxRetryDelay = 30000,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualClose = useRef(false);
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    retryCount: 0,
    lastMessage: null
  });

  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      
      // Remove event listeners to prevent memory leaks
      ws.onopen = null;
      ws.onclose = null;
      ws.onmessage = null;
      ws.onerror = null;
      
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Component unmounting');
      }
    }
  }, []);

  const calculateRetryDelay = useCallback((retryCount: number): number => {
    const exponentialDelay = initialRetryDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, maxRetryDelay);
  }, [initialRetryDelay, maxRetryDelay]);

  const connect = useCallback(() => {
    if (!url || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up any existing connection
    cleanup();

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          retryCount: 0
        }));
        onConnect?.();
      };

      ws.onclose = (event) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        if (!isManualClose.current && state.retryCount < maxRetries) {
          const delay = calculateRetryDelay(state.retryCount);
          
          setState(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1,
            error: `Connection lost. Retrying in ${Math.round(delay / 1000)}s... (${prev.retryCount + 1}/${maxRetries})`
          }));

          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (state.retryCount >= maxRetries) {
          setState(prev => ({
            ...prev,
            error: 'Maximum retry attempts reached. Connection failed.'
          }));
        }

        onDisconnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            lastMessage: message
          }));
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false
        }));
        onError?.(error);
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to create WebSocket connection'
      }));
    }
  }, [url, state.retryCount, maxRetries, calculateRetryDelay, onConnect, onDisconnect, onMessage, onError, cleanup]);

  const disconnect = useCallback(() => {
    isManualClose.current = true;
    cleanup();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
      retryCount: 0
    }));
  }, [cleanup]);

  const reconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: 0,
      error: null
    }));
    isManualClose.current = false;
    connect();
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Auto-connect when URL changes
  useEffect(() => {
    if (url) {
      isManualClose.current = false;
      connect();
    }

    return () => {
      isManualClose.current = true;
      cleanup();
    };
  }, [url, connect, cleanup]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    sendMessage
  };
}