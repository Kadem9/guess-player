// gestion events pr les parties
function normalizeGameId(gameId) {
  return gameId.toLowerCase();
}

// stockage des connexions socket -> {gameId, userId, isHost}
const socketConnections = new Map();

function setupGameSocketHandlers(io) {
  io.on('connection', (socket) => {

    // join partie avec userId
    socket.on('join-game', (data) => {
      // support ancien format (string) et nouveau format (object)
      let gameId, userId, isHost;
      if (typeof data === 'string') {
        gameId = data;
        userId = null;
        isHost = false;
      } else {
        gameId = data.gameId;
        userId = data.userId;
        isHost = data.isHost || false;
      }
      
      const normalizedGameId = normalizeGameId(gameId);
      const room = `game:${normalizedGameId}`;
      socket.join(room);
      
      // stocker les infos de connexion
      if (userId) {
        socketConnections.set(socket.id, { gameId: normalizedGameId, userId, isHost });
      }
      
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      const count = socketsInRoom ? socketsInRoom.size : 0;
    });

    // quitter partie
    socket.on('leave-game', (data) => {
      let gameId;
      if (typeof data === 'string') {
        gameId = data;
      } else {
        gameId = data.gameId;
      }
      
      const normalizedGameId = normalizeGameId(gameId);
      const room = `game:${normalizedGameId}`;
      socket.leave(room);
      
      // supprimer les infos de connexion
      socketConnections.delete(socket.id);
      
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      const count = socketsInRoom ? socketsInRoom.size : 0;
    });

    // démarrer partie
    socket.on('start-game', (gameId) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-started', { gameId: normalizedGameId });
    });

    // nouvelle réponse soumise
    socket.on('answer-submitted', ({ gameId, playerId, isCorrect }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-updated', { gameId: normalizedGameId });
    });

    // nouveau tour
    socket.on('turn-changed', ({ gameId, turn }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('turn-updated', { gameId: normalizedGameId, turn });
    });

    // forfait
    socket.on('player-forfeit', ({ gameId, playerId }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-finished', { gameId: normalizedGameId });
    });

    // partie terminée
    socket.on('game-ended', ({ gameId }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-finished', { gameId: normalizedGameId });
    });

    // chat message
    socket.on('chat-message', ({ gameId, userId, username, message, timestamp }) => {
      const normalizedGameId = normalizeGameId(gameId);
      // diffuser le message à tous les joueurs de la room
      io.to(`game:${normalizedGameId}`).emit('chat-message', {
        userId,
        username,
        message,
        timestamp: timestamp || new Date().toISOString()
      });
    });

    socket.on('disconnect', async () => {
      
      // vérifier si ce socket était dans une partie
      const connectionInfo = socketConnections.get(socket.id);
      if (connectionInfo && connectionInfo.userId && !connectionInfo.isHost) {
        const { gameId, userId } = connectionInfo;
        
        // appeler l'API pour retirer le joueur
        try {
          const apiUrl = process.env.NEXT_API_URL || 'http://localhost:3000';
          const response = await fetch(`${apiUrl}/api/games/${gameId}/socket-disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, socketSecret: process.env.SOCKET_SECRET || 'socket-internal-secret' }),
          });
          
          if (response.ok) {
            // émettre game-updated aux autres joueurs
            io.to(`game:${gameId}`).emit('game-updated', { gameId });
          } else {
            const error = await response.json();
          }
        } catch (error) {
          console.error('[SOCKET] Erreur appel API socket-disconnect:', error.message);
        }
      }
      
      // nettoyer
      socketConnections.delete(socket.id);
    });
  });
}

module.exports = { setupGameSocketHandlers };

