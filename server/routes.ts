import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, drawingCommandSchema, cursorUpdateSchema, type DrawingCommand } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  interface ExtendedWebSocket extends WebSocket {
    userId?: string;
    roomId?: string;
  }

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
              cursorPosition: null,
              lastSeen: Date.now()
            });

            // Notify all users in room about new user
            broadcastToRoom(ws.roomId, {
              type: 'user-joined',
              userId: data.userId,
              userCount: await storage.getUsersCount(data.roomId)
            }, ws);
            
            break;

          case 'cursor-move':
            if (ws.userId && ws.roomId) {
              const cursorData = cursorUpdateSchema.parse({
                userId: ws.userId,
                roomId: ws.roomId,
                position: data.position
              });
              
              await storage.updateUserCursor(cursorData.userId, cursorData.position);
              
              broadcastToRoom(ws.roomId, {
                type: 'cursor-update',
                userId: cursorData.userId,
                position: cursorData.position
              }, ws);
            }
            break;

          case 'draw-command':
            if (ws.userId && ws.roomId) {
              const command: DrawingCommand = drawingCommandSchema.parse({
                ...data.command,
                userId: ws.userId,
                timestamp: Date.now()
              });
              
              if (command.type === 'clear') {
                await storage.clearRoomDrawing(ws.roomId);
              } else {
                await storage.addDrawingCommand(ws.roomId, command);
              }
              
              broadcastToRoom(ws.roomId, {
                type: 'draw-command',
                command
              }, ws);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', async () => {
      if (ws.userId && ws.roomId) {
        await storage.removeUser(ws.userId);
        
        broadcastToRoom(ws.roomId, {
          type: 'user-left',
          userId: ws.userId,
          userCount: await storage.getUsersCount(ws.roomId)
        });
      }
    });
  });

  function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (client.readyState === WebSocket.OPEN && 
          client.roomId === roomId && 
          client !== excludeWs) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
