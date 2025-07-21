import { useState } from 'react';
import RoomJoin from '../components/RoomJoin';
import Whiteboard from '../components/Whiteboard';

interface Room {
  roomId: string;
  drawingData: any[];
}

interface RoomData {
  room: {
    roomId: string;
    drawingData: any[];
  };
}

export default function WhiteboardPage() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  const handleJoinRoom = (roomId: string, roomData: RoomData) => {
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