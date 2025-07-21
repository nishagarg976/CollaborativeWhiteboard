import { useState } from 'react';
import RoomJoin from '../components/RoomJoin';
import Whiteboard from '../components/Whiteboard';

export default function WhiteboardPage() {
  const [currentRoom, setCurrentRoom] = useState(null);

  const handleJoinRoom = (roomId, roomData) => {
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