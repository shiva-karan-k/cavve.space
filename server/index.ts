import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { CaveRoom } from './rooms/CaveRoom';

const app = express();
app.use(express.json());

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const server = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: server,
  }),
});

// Register room handlers
gameServer.define('cave', CaveRoom);

const port = Number(process.env.PORT) || 2567;
gameServer.listen(port);

console.log(`🚀 Colyseus server is listening on ws://localhost:${port}`);

