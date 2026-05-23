# Multiplayer Grid Game

A real-time, competitive multiplayer browser game where players compete to claim the most boxes on a 4x4 grid.

## Overview

This project is a full-stack application consisting of:
- **Frontend**: A sleek React application built with Vite.
- **Backend**: A robust NestJS server using WebSockets, Prisma, and Redis.

Players can join or create game rooms (up to 3 players per room). The game starts automatically when the room is full. Players click on the grid boxes to claim them in real-time. The player with the most claimed boxes at the end of the match wins!

## Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Custom glassmorphism UI)
- **Icons**: Lucide React
- **Language**: TypeScript

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL (via Prisma ORM)
- **In-Memory Store**: Redis (for fast, real-time game state tracking)
- **Real-time Communication**: Native WebSockets (`ws` and `@nestjs/platform-ws`)
- **Language**: TypeScript

## Prerequisites

Before running this project, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

## Setup & Installation

### 1. Backend Setup

Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Configure your environment variables. Ensure your `.env` file in the `backend` directory looks something like this:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/multiplayer_game"
REDIS_URL="redis://localhost:6379"
```

Run the database migrations to set up the PostgreSQL schema:
```bash
npx prisma migrate dev
```

Start the backend development server:
```bash
npm run start:dev
```

### 2. Frontend Setup

Open a new terminal window, navigate to the `frontend` directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

## How to Play

1. Open the frontend URL in your browser (typically `http://localhost:5173`).
2. Enter your display name.
3. You can either **Start a New Game** or **Join an Existing Game** using a Room ID.
4. Share the Room ID with your friends.
5. Once the room reaches its capacity (3 players), the grid will appear.
6. Click on unowned boxes to claim them in your assigned color.
7. The game ends when all 16 boxes have been claimed. The player with the most boxes wins!

## Project Structure

```
multiplayer-game/
├── backend/                  # NestJS server
│   ├── prisma/               # Database schema & migrations
│   ├── src/
│   │   ├── game/             # Game logic & WebSocket Gateway
│   │   ├── player/           # Player management & repo
│   │   └── redis/            # Redis integration for fast state access
│   └── ...
├── frontend/                 # React client
│   ├── src/
│   │   ├── components/       # UI Components (GameBoard, Lobby, etc.)
│   │   ├── context/          # React Context for WebSocket & game state
│   │   └── ...
└── README.md
```

## Architecture Notes

- **Persistent Data (PostgreSQL)**: Stores long-term data such as players, game sessions, historical match data, and final scores.
- **Active State (Redis)**: Handles the highly concurrent, real-time game state (which boxes are claimed) to ensure high-performance updates during active gameplay without hammering the database.
- **Real-Time Engine (WebSockets)**: Facilitates instant, bi-directional communication between clients and the server to broadcast player moves, connections, disconnections, and match resolutions.

### Solved problems
- Did your game break when a player refreshed the tab? That's the reconnection + state resync problem. How do you bring a reconnected client back to the current game state without restarting the room? ✅
- Did you handle the case where the server thinks a client is connected but they're actually gone (wifi dropped, laptop closed)? That's zombie connection detection — you need a heartbeat/ping system. ✅
- What happened if two players sent an action at the exact same millisecond? That's event ordering and conflict resolution — the core problem in any real-time multiplayer system. ✅