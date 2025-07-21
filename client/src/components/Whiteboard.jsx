import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import UserCursors from './UserCursors';
import { useWebSocket } from '../hooks/useWebSocket';
import { Users, Wifi, WifiOff } from 'lucide-react';

const INITIAL_TOOL = {
  color: '#000000',
  strokeWidth: 3,
  type: 'pencil'
};

export default function Whiteboard({ roomId, initialDrawingData, onLeaveRoom }) {
  const [tool, setTool] = useState(INITIAL_TOOL);
  const [drawingData, setDrawingData] = useState(initialDrawingData);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(1);
  const { toast } = useToast();

  // Generate a unique user ID
  const userIdRef = useRef(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const userId = userIdRef.current;

  const { socket, connectionStatus, sendCursorPosition, sendDrawingCommand } = useWebSocket(roomId, userId);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'draw-command':
            setDrawingData(prev => {
              if (data.command.type === 'clear') {
                return [];
              } else {
                return [...prev, data.command];
              }
            });
            break;

          case 'cursor-update':
            setUsers(prev => {
              const existingUser = prev.find(u => u.id === data.userId);
              if (existingUser) {
                return prev.map(u => 
                  u.id === data.userId 
                    ? { ...u, cursorPosition: data.position, lastSeen: Date.now() }
                    : u
                );
              } else {
                return [...prev, {
                  id: data.userId,
                  roomId,
                  cursorPosition: data.position,
                  lastSeen: Date.now()
                }];
              }
            });
            break;

          case 'user-joined':
            setUserCount(data.userCount || 1);
            break;

          case 'user-left':
            setUserCount(data.userCount || 1);
            setUsers(prev => prev.filter(u => u.id !== data.userId));
            break;

          case 'error':
            toast({
              title: "Connection Error",
              description: data.message,
              variant: "destructive",
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, roomId, toast]);

  const handleToolChange = (changes) => {
    setTool(prev => ({ ...prev, ...changes }));
  };

  const handleDrawingCommand = (command) => {
    const fullCommand = {
      ...command,
      userId,
      timestamp: Date.now()
    };

    // Update local state immediately for smooth drawing
    if (command.type === 'clear') {
      setDrawingData([]);
    } else {
      setDrawingData(prev => [...prev, fullCommand]);
    }

    // Send to other users
    sendDrawingCommand(command);
  };

  const handleClearCanvas = () => {
    const clearCommand = {
      id: `clear_${Date.now()}`,
      type: 'clear',
      data: null
    };

    handleDrawingCommand(clearCommand);
  };

  const handleCursorMove = (position) => {
    sendCursorPosition(position);
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      onLeaveRoom();
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      toast({
        title: "Room Code Copied",
        description: `Room code ${roomId} copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy room code to clipboard",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Whiteboard</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="bg-gray-100 px-3 py-1 rounded-full font-mono">{roomId}</span>
            <div className="flex items-center space-x-1">
              {connectionStatus.connected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <Users className="w-4 h-4" />
              <span>{userCount}</span>
              <span>users</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={copyRoomCode}
          >
            Share Room
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveRoom}
            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
          >
            Leave Room
          </Button>
        </div>
      </header>

      {/* Main Drawing Area */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* Drawing Canvas */}
        <DrawingCanvas
          tool={tool}
          drawingData={drawingData}
          onDrawingCommand={handleDrawingCommand}
          onCursorMove={handleCursorMove}
        />

        {/* User Cursors */}
        <UserCursors users={users} currentUserId={userId} />

        {/* Drawing Toolbar */}
        <Toolbar
          tool={tool}
          onToolChange={handleToolChange}
          onClearCanvas={handleClearCanvas}
        />

        {/* Connection Status Toast */}
        {connectionStatus.reconnecting && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-700">Reconnecting...</span>
            </div>
          </div>
        )}

      </div>
      
      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Canvas: Ready</span>
          <span>Tool: {tool.type} • {tool.color} • {tool.strokeWidth}px</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

    </div>
  );
}