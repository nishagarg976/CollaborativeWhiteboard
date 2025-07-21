import { rooms } from "../shared/schema.js";

export class MemStorage {
  constructor() {
    this.rooms = new Map();
    this.users = new Map();
    this.currentRoomId = 1;
  }

  async getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  async createRoom(insertRoom) {
    const room = {
      id: this.currentRoomId++,
      roomId: insertRoom.roomId,
      createdAt: new Date(),
      lastActivity: new Date(),
      drawingData: [],
    };
    this.rooms.set(insertRoom.roomId, room);
    return room;
  }

  async updateRoomActivity(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = new Date();
    }
  }

  async addDrawingCommand(roomId, command) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.drawingData.push(command);
      room.lastActivity = new Date();
    }
  }

  async clearRoomDrawing(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.drawingData = [];
      room.lastActivity = new Date();
    }
  }

  async addUser(user) {
    this.users.set(user.id, user);
  }

  async removeUser(userId) {
    this.users.delete(userId);
  }

  async updateUserCursor(userId, position) {
    const user = this.users.get(userId);
    if (user) {
      user.cursorPosition = position;
      user.lastSeen = Date.now();
    }
  }

  async getRoomUsers(roomId) {
    return Array.from(this.users.values()).filter(user => user.roomId === roomId);
  }

  async getUsersCount(roomId) {
    return Array.from(this.users.values()).filter(user => user.roomId === roomId).length;
  }
}

export const storage = new MemStorage();