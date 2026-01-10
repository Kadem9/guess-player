const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { setupGameSocketHandlers } = require('./socket/gameSocket');
const { setupEmitRoutes } = require('./routes/emitRoutes');

const app = express();
const httpServer = createServer(app);

// config cors
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// config socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// handlers socket.io
setupGameSocketHandlers(io);

// routes http
setupEmitRoutes(app, io);

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
});


