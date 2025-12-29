// gestion des events pr les parties
function normalizeGameId(gameId) {
  return gameId.toLowerCase();
}

function setupGameSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Rejoindre une partie
    socket.on('join-game', (gameId) => {
      const normalizedGameId = normalizeGameId(gameId);
      socket.join(`game:${normalizedGameId}`);
    });

    // Quitter une partie
    socket.on('leave-game', (gameId) => {
      const normalizedGameId = normalizeGameId(gameId);
      socket.leave(`game:${normalizedGameId}`);
    });

    // Démarrer une partie
    socket.on('start-game', (gameId) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-started', { gameId: normalizedGameId });
    });

    // Nouvelle réponse soumise
    socket.on('answer-submitted', ({ gameId, playerId, isCorrect }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-updated', { gameId: normalizedGameId });
    });

    // Nouveau tour
    socket.on('turn-changed', ({ gameId, turn }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('turn-updated', { gameId: normalizedGameId, turn });
    });

    // Forfait
    socket.on('player-forfeit', ({ gameId, playerId }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-finished', { gameId: normalizedGameId });
    });

    // Partie terminée
    socket.on('game-ended', ({ gameId }) => {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-finished', { gameId: normalizedGameId });
    });

    socket.on('disconnect', () => {
      // Cleanup si nécessaire
    });
  });
}

module.exports = { setupGameSocketHandlers };

