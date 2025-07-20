import { useState } from 'react';
import RoomJoin from '../components/RoomJoin';
import Whiteboard from '../components/Whiteboard';
import { DrawingCommand } from '../types/whiteboard';

export default function WhiteboardPage() {
  const [currentRoom, setCurrentRoom] = useState<{
    roomId: string;
    drawingData: DrawingCommand[];
  } | null>(null);

  const handleJoinRoom = (roomId: string, roomData: any) => {
    setCurrentRoom({
      roomId,
      drawingData: roomData.room.drawingData || []
    });
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  return (
    <>
      {!currentRoom ? (
        <RoomJoin onJoinRoom={handleJoinRoom} />
      ) : (
        <Whiteboard
          roomId={currentRoom.roomId}
          initialDrawingData={currentRoom.drawingData}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </>
  );
}
