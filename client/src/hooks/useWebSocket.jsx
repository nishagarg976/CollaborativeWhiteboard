import { useEffect, useRef, useState } from 'react';

export function useWebSocket(roomId, userId) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reconnecting: false
  });
  
  const reconnectTimeoutRef = useRef();
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

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const sendCursorPosition = (position) => {
    sendMessage({
      type: 'cursor-move',
      position
    });
  };

  const sendDrawingCommand = (command) => {
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