# Collaborative Whiteboard Application

## Overview

This is a real-time collaborative whiteboard application built with a modern web stack. The application allows users to join whiteboard rooms using simple room codes and collaborate in real-time with drawing capabilities and live cursor tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React hooks and context
- **UI Framework**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Real-time Communication**: WebSocket API
- **Data Fetching**: TanStack Query (React Query)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **WebSocket Server**: Built-in WebSocket (ws) library
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Storage**: PostgreSQL-based sessions with connect-pg-simple
- **Build**: ESBuild for production bundling

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations
- **In-Memory Storage**: Fallback memory storage implementation for development
- **Session Storage**: PostgreSQL-based session store

## Key Components

### Frontend Components
1. **RoomJoin**: Entry point for joining/creating rooms with validation
2. **Whiteboard**: Main collaborative canvas container
3. **DrawingCanvas**: HTML5 canvas with drawing logic and event handling
4. **Toolbar**: Drawing controls (color picker, stroke width, clear button)
5. **UserCursors**: Real-time cursor position display for other users

### Backend Components
1. **REST API Routes**: Room management endpoints
2. **WebSocket Server**: Real-time communication for drawing and cursor updates
3. **Storage Layer**: Abstracted storage interface with memory and database implementations
4. **Room Management**: Room creation, user tracking, and drawing data persistence

### Real-time Features
- **Live Drawing Sync**: All drawing strokes synchronized instantly across users
- **Cursor Tracking**: Real-time mouse/touch position sharing
- **User Presence**: Active user count display
- **Auto-reconnection**: WebSocket reconnection with exponential backoff

## Data Flow

### Room Joining Flow
1. User enters room code in RoomJoin component
2. Frontend validates code format (6-8 alphanumeric characters)
3. POST request to `/api/rooms/join` creates or retrieves room
4. WebSocket connection established for real-time features
5. User receives existing drawing data and joins collaborative session

### Drawing Flow
1. User draws on HTML5 canvas
2. Drawing events captured and converted to stroke data
3. Commands sent via WebSocket to server
4. Server broadcasts to all room participants
5. Other users receive and render drawing commands
6. Drawing data persisted to database

### Cursor Tracking Flow
1. Mouse/touch events captured on canvas
2. Cursor position sent via WebSocket
3. Server broadcasts position to other room users
4. Positions rendered as colored cursors with animations

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Router alternative (Wouter)
- **UI Library**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: TanStack Query for server state
- **Utilities**: date-fns, clsx, class-variance-authority

### Backend Dependencies
- **Web Framework**: Express.js with middleware
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Real-time**: WebSocket (ws) library
- **Session Management**: connect-pg-simple for PostgreSQL sessions
- **Validation**: Zod for schema validation
- **Utilities**: nanoid for ID generation

### Development Dependencies
- **Build Tools**: Vite, ESBuild, TypeScript
- **Development**: tsx for TypeScript execution
- **Database Tools**: Drizzle Kit for schema management

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets in `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Database Migration**: Drizzle Kit handles schema migrations

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection
- **Development**: Local development with tsx and Vite dev server
- **Production**: Node.js server serving static assets and API endpoints

### File Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── dist/           # Production build output
```

### Key Architectural Decisions

1. **Monorepo Structure**: Frontend and backend in single repository for shared types
2. **WebSocket over Socket.io**: Lighter weight solution for real-time features
3. **Memory + Database Storage**: Dual storage strategy for development and production
4. **Canvas-based Drawing**: HTML5 Canvas for smooth drawing performance
5. **No Authentication**: Simplified user experience with anonymous room access
6. **PostgreSQL Sessions**: Persistent session storage for scalability