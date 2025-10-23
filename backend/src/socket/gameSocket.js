const { verifyToken } = require('../lib/auth');

function initializeGameSocket(io) {
  // middleware d'authentification pr socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Token manquant'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Token invalide'));
    }

    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Utilisateur connecté: ${socket.username} (${socket.userId})`);

    // rejoindre une salle de jeu
    socket.on('join-game', (gameId) => {
      socket.join(gameId);
      console.log(`${socket.username} a rejoint la partie ${gameId}`);
      
      // notification aux autres joueurs
      socket.to(gameId).emit('player-joined', {
        userId: socket.userId,
        username: socket.username
      });
    });

    // quitter une salle de jeu
    socket.on('leave-game', (gameId) => {
      socket.leave(gameId);
      console.log(`${socket.username} a quitté la partie ${gameId}`);
      
      // notification aux autres joueurs
      socket.to(gameId).emit('player-left', {
        userId: socket.userId,
        username: socket.username
      });
    });

    // nvx tour
    socket.on('new-turn', ({ gameId, currentPlayerId, turn }) => {
      console.log(`Nouveau tour dans ${gameId}: joueur ${currentPlayerId}, tour ${turn}`);
      io.to(gameId).emit('turn-updated', { currentPlayerId, turn });
    });

    // maj du score
    socket.on('score-update', ({ gameId, playerId, score }) => {
      console.log(`Score mis à jour dans ${gameId}: joueur ${playerId} = ${score}`);
      io.to(gameId).emit('score-updated', { playerId, score });
    });

    // nvl question
    socket.on('new-question', ({ gameId, playerData }) => {
      console.log(`Nouvelle question dans ${gameId}`);
      io.to(gameId).emit('question-updated', { playerData });
    });

    // devinette envoyée
    socket.on('guess-submitted', ({ gameId, playerId, guess, isCorrect }) => {
      console.log(`Devinette dans ${gameId}: ${guess} = ${isCorrect}`);
      io.to(gameId).emit('guess-result', { playerId, guess, isCorrect });
    });

    // fin de partie
    socket.on('game-ended', ({ gameId, winner, finalScores }) => {
      console.log(`Partie terminée: ${gameId}, gagnant: ${winner?.username}`);
      io.to(gameId).emit('game-finished', { winner, finalScores });
    });

    // déconnexion
    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.username}`);
    });
  });
}

module.exports = { initializeGameSocket };


