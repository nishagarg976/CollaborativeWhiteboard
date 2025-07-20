import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomId: text("roomId").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActivity: timestamp("lastActivity").defaultNow().notNull(),
  drawingData: jsonb("drawingData").$type<DrawingCommand[]>().default([]).notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  roomId: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Drawing command types
export interface DrawingCommand {
  id: string;
  type: 'stroke' | 'clear';
  data: StrokeData | null;
  timestamp: number;
  userId: string;
}

export interface StrokeData {
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface User {
  id: string;
  roomId: string;
  cursorPosition: Point | null;
  lastSeen: number;
}

export const drawingCommandSchema = z.object({
  id: z.string(),
  type: z.enum(['stroke', 'clear']),
  data: z.object({
    points: z.array(z.object({
      x: z.number(),
      y: z.number()
    })).optional(),
    color: z.string().optional(),
    strokeWidth: z.number().optional()
  }).nullable(),
  timestamp: z.number(),
  userId: z.string()
});

export const cursorUpdateSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).nullable()
});
