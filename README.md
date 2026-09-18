# Real-Time Collaborative Whiteboard

A full-stack real-time collaborative whiteboard built with **React, Node.js, WebSockets, MongoDB, JWT, Canvas and RoughJS**.

## Features

- Real-time multi-user drawing through WebSockets
- JWT-based authentication for protected REST APIs and WebSocket connections
- MongoDB persistence for users and whiteboards
- 14+ drawing/interaction tools
- RoughJS hand-drawn rendering
- Select, move, resize and delete elements
- Precision eraser with hit testing
- Undo/redo per connected client
- Live collaborator presence and cursors
- Debounced/throttled drawing updates to reduce network traffic
- Server-side validation of collaborative messages
- Health endpoint for deployment monitoring
- Vercel-ready React client and Render-ready Node server

## Toolset

1. Select
2. Pencil
3. Line
4. Arrow
5. Rectangle
6. Ellipse
7. Diamond
8. Triangle
9. Text
10. Eraser
11. Pan
12. Laser pointer
13. Sticky note
14. Frame

## Architecture

```text
React + Canvas + RoughJS
        |
        | REST (JWT)
        v
Node.js + Express ----------------> MongoDB
        |
        | WebSocket
        v
Collaborative room
```

The client maintains a local scene graph for responsive drawing. WebSocket messages synchronize room state. The server validates messages and broadcasts compact operation payloads to peers.

## Run locally

### 1. Start MongoDB

Use a local MongoDB instance or MongoDB Atlas.

### 2. Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Default server: `http://localhost:5000`

### 3. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Default client: `http://localhost:5173`

The client expects:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
```

## Production deployment

### Server on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Add `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`
- Render provides `PORT`

### Client on Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Add:
  - `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`
  - `VITE_WS_URL=wss://YOUR-RENDER-SERVICE.onrender.com/ws`

## Performance notes

The implementation uses:
- requestAnimationFrame for pointer rendering
- throttled pointer updates
- incremental scene updates instead of full REST writes
- compact WebSocket operation types
- server-side room membership
- MongoDB indexes for user/email and whiteboard/owner lookups

Do not present a specific latency or response-time improvement as measured fact unless you benchmark the deployed environment. A benchmark script is included under `server/scripts/benchmark.js` so those resume metrics can be measured and documented honestly.

## Security

- Passwords are hashed with bcrypt
- JWT is required for protected REST endpoints
- WebSocket connections require JWT
- WebSocket payloads are schema-validated
- Message sizes are bounded
- CORS is restricted to configured client origin
- MongoDB credentials stay server-side

## License

MIT
