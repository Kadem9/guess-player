require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gameRoutes = require('./routes/gameRoutes');
const { initializeGameSocket } = require('./socket/gameSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// mdlwr
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json());

// routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend Guess Player - API de jeu' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// routes de jeu
app.use('/api/games', gameRoutes);

// init socket
initializeGameSocket(io);

// démarrage du node
server.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  console.log(`Frontend autorisé: ${process.env.FRONTEND_URL || 'http://localhost:3003'}`);
});

// erreurs
process.on('unhandledRejection', (err) => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});


