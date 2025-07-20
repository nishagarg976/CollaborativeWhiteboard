import { rooms, type Room, type InsertRoom, type DrawingCommand, type User } from "@shared/schema";

export interface IStorage {
  // Room management
  getRoom(roomId: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoomActivity(roomId: string): Promise<void>;
  addDrawingCommand(roomId: string, command: DrawingCommand): Promise<void>;
  clearRoomDrawing(roomId: string): Promise<void>;
  
  // User management
  addUser(user: User): Promise<void>;
  removeUser(userId: string): Promise<void>;
  updateUserCursor(userId: string, position: { x: number; y: number } | null): Promise<void>;
  getRoomUsers(roomId: string): Promise<User[]>;
  getUsersCount(roomId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private users: Map<string, User>;
  private currentRoomId: number;

  constructor() {
    this.rooms = new Map();
    this.users = new Map();
    this.currentRoomId = 1;
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    return this.rooms.get(roomId);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      id: this.currentRoomId++,
      roomId: insertRoom.roomId,
      createdAt: new Date(),
      lastActivity: new Date(),
      drawingData: [],
    };
    this.rooms.set(insertRoom.roomId, room);
    return room;
  }

  async updateRoomActivity(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = new Date();
    }
  }

  async addDrawingCommand(roomId: string, command: DrawingCommand): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.drawingData.push(command);
      room.lastActivity = new Date();
    }
  }

  async clearRoomDrawing(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.drawingData = [];
      room.lastActivity = new Date();
    }
  }

  async addUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async removeUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  async updateUserCursor(userId: string, position: { x: number; y: number } | null): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.cursorPosition = position;
      user.lastSeen = Date.now();
    }
  }

  async getRoomUsers(roomId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.roomId === roomId);
  }

  async getUsersCount(roomId: string): Promise<number> {
    return Array.from(this.users.values()).filter(user => user.roomId === roomId).length;
  }
}

export const storage = new MemStorage();
