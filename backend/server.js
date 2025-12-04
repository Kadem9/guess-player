const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  // Rejoindre une partie
  socket.on('join-game', (gameId) => {
    const normalizedGameId = gameId.toLowerCase();
    socket.join(`game:${normalizedGameId}`);
    // Ne pas émettre game-updated ici, juste rejoindre la room
  });

  // Quitter une partie
  socket.on('leave-game', (gameId) => {
    const normalizedGameId = gameId.toLowerCase();
    socket.leave(`game:${normalizedGameId}`);
    // Ne pas émettre game-updated ici, juste quitter la room
  });

  // Démarrer une partie
  socket.on('start-game', (gameId) => {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('game-started', { gameId: normalizedGameId });
  });

  // Nouvelle réponse soumise
  socket.on('answer-submitted', ({ gameId, playerId, isCorrect }) => {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('game-updated', { gameId: normalizedGameId });
  });

  // Nouveau tour
  socket.on('turn-changed', ({ gameId, turn }) => {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('turn-updated', { gameId: normalizedGameId, turn });
  });

  // Forfait
  socket.on('player-forfeit', ({ gameId, playerId }) => {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('game-finished', { gameId: normalizedGameId });
  });

  // Partie terminée
  socket.on('game-ended', ({ gameId }) => {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('game-finished', { gameId: normalizedGameId });
  });

  socket.on('disconnect', () => {
    // Cleanup
  });
});

// Route POST pour émettre des événements depuis les API Next.js
app.post('/emit/game-started', (req, res) => {
  const { gameId } = req.body;
  if (gameId) {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('game-started', { gameId: normalizedGameId });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'gameId requis' });
  }
});

app.post('/emit/game-updated', (req, res) => {
  const { gameId } = req.body;
  if (gameId) {
    const normalizedGameId = gameId.toLowerCase();
    io.to(`game:${normalizedGameId}`).emit('game-updated', { gameId: normalizedGameId });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'gameId requis' });
  }
});

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur WebSocket Socket.io lancé sur le port ${PORT}`);
});


