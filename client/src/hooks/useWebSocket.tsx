import { useEffect, useRef, useState } from 'react';
import { DrawingCommand, ConnectionStatus } from '../types/whiteboard';

export function useWebSocket(roomId: string | null, userId: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false
  });
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!roomId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus({ connected: true, reconnecting: false });
      reconnectAttemptsRef.current = 0;
      
      // Join the room
      ws.send(JSON.stringify({
        type: 'join-room',
        userId,
        roomId
      }));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus(prev => ({ ...prev, connected: false }));
      setSocket(null);
      
      // Auto-reconnect with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setConnectionStatus(prev => ({ ...prev, reconnecting: true }));
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);
  };

  useEffect(() => {
    if (roomId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomId]);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const sendCursorPosition = (position: { x: number; y: number } | null) => {
    sendMessage({
      type: 'cursor-move',
      position
    });
  };

  const sendDrawingCommand = (command: Omit<DrawingCommand, 'userId' | 'timestamp'>) => {
    sendMessage({
      type: 'draw-command',
      command
    });
  };

  return {
    socket,
    connectionStatus,
    sendCursorPosition,
    sendDrawingCommand
  };
}
