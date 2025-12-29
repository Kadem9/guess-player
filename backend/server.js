const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { setupGameSocketHandlers } = require('./socket/gameSocket');
const { setupEmitRoutes } = require('./routes/emitRoutes');

const app = express();
const httpServer = createServer(app);

// Configuration CORS
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Configuration Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// handlers Socket.io
setupGameSocketHandlers(io);

// routes HTTP
setupEmitRoutes(app, io);

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Serveur WebSocket Socket.io lancé sur le port ${PORT}`);
});


