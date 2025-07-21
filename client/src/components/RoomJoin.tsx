import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RoomJoinProps {
  onJoinRoom: (roomId: string, roomData: any) => void;
}

export default function RoomJoin({ onJoinRoom }: RoomJoinProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateRoomCode = (code: string): boolean => {
    return code.length >= 6 && code.length <= 8 && /^[A-Z0-9]+$/.test(code);
  };

  const handleJoinRoom = async () => {
    const trimmedCode = roomCode.trim().toUpperCase();
    
    if (!validateRoomCode(trimmedCode)) {
      toast({
        title: "Invalid Room Code",
        description: "Room code must be 6-8 characters long and contain only letters and numbers.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/rooms/join', { roomId: trimmedCode });
      const data = await response.json();
      
      if (data.success) {
        onJoinRoom(trimmedCode, data);
        toast({
          title: "Joined Room",
          description: `Successfully joined room ${trimmedCode}`,
        });
      } else {
        throw new Error(data.message || 'Failed to join room');
      }
    } catch (error) {
      toast({
        title: "Failed to Join Room",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(result);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Join Whiteboard</h1>
            <p className="text-gray-600">Enter a room code to join or create a new whiteboard session</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </Label>
              <Input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="text-center text-lg font-mono uppercase tracking-widest"
                placeholder="ABC123"
                maxLength={8}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">6-8 characters, letters and numbers only</p>
            </div>
            
            <Button 
              onClick={handleJoinRoom}
              className="w-full"
              disabled={isLoading || !roomCode.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </Button>
            
            <div className="text-center">
              <Button
                variant="link"
                onClick={generateRoomCode}
                className="text-primary hover:text-blue-700 text-sm font-medium"
                disabled={isLoading}
              >
                Generate Random Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
