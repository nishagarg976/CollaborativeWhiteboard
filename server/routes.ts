import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, drawingCommandSchema, cursorUpdateSchema } from "../shared/schema";
import { z } from "zod";
import type { Express } from "express";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // REST API Routes
  app.post("/api/rooms/join", async (req, res) => {
    try {
      const { roomId } = insertRoomSchema.parse(req.body);
      
      let room = await storage.getRoom(roomId);
      if (!room) {
        room = await storage.createRoom({ roomId });
      } else {
        await storage.updateRoomActivity(roomId);
      }

      const userCount = await storage.getUsersCount(roomId);
      
      res.json({ 
        success: true, 
        room: {
          roomId: room.roomId,
          drawingData: room.drawingData
        },
        userCount 
      });
    } catch (error) {
      res.status(400).json({ success: false, message: "Invalid room code" });
    }
  });

  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ success: false, message: "Room not found" });
      }

      const userCount = await storage.getUsersCount(roomId);
      
      res.json({ 
        success: true, 
        room: {
          roomId: room.roomId,
          drawingData: room.drawingData
        },
        userCount 
      });
    } catch (error) {
      res.status(400).json({ success: false, message: "Invalid request" });
    }
  });

  // WebSocket Setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join-room':
            ws.userId = data.userId;
            ws.roomId = data.roomId;
            
            await storage.addUser({
              id: data.userId,
              roomId: data.roomId,
              lastSeen: Date.now()
            });

            // Broadcast user joined
            if (ws.roomId) {
              broadcastToRoom(ws.roomId, {
                type: 'user-joined',
                userId: data.userId,
                userCount: await storage.getUsersCount(data.roomId)
              }, wss);
            }
            break;

          case 'drawing-command':
            const drawingCommand = drawingCommandSchema.parse(data);
            if (ws.roomId) {
              await storage.addDrawingCommand(ws.roomId, drawingCommand);
              
              // Broadcast to all users in the room except sender
              broadcastToRoom(ws.roomId, {
                ...drawingCommand
              }, wss, ws);
            }
            break;

          case 'cursor-update':
            const cursorUpdate = cursorUpdateSchema.parse(data);
            if (ws.roomId && cursorUpdate.position) {
              await storage.updateUserCursor(cursorUpdate.userId, cursorUpdate.position);
              
              // Broadcast cursor position to other users
              broadcastToRoom(ws.roomId, {
                type: 'cursor-update',
                ...cursorUpdate
              }, wss, ws);
            }
            break;

          case 'clear-canvas':
            if (ws.roomId) {
              await storage.clearRoomDrawing(ws.roomId);
              
              // Broadcast clear command to all users in the room
              broadcastToRoom(ws.roomId, {
                type: 'clear-canvas',
                userId: ws.userId
              }, wss);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      if (ws.userId && ws.roomId) {
        await storage.removeUser(ws.userId);
        
        // Broadcast user left
        const roomId = ws.roomId;
        broadcastToRoom(roomId, {
          type: 'user-left',
          userId: ws.userId,
          userCount: await storage.getUsersCount(roomId)
        }, wss);
      }
    });
  });

  return httpServer;
}

function broadcastToRoom(roomId: string, message: any, wss: WebSocketServer, exclude?: ExtendedWebSocket) {
  wss.clients.forEach((client: ExtendedWebSocket) => {
    if (client !== exclude && client.roomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}