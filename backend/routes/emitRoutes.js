// routes http pr emettre des evenets socket io depuis l'api next js
function normalizeGameId(gameId) {
  return gameId.toLowerCase();
}

function setupEmitRoutes(app, io) {
  // Route POST pour émettre game-started
  app.post('/emit/game-started', (req, res) => {
    const { gameId } = req.body;
    if (gameId) {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-started', { gameId: normalizedGameId });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'gameId requis' });
    }
  });

  // Route POST pour émettre game-updated
  app.post('/emit/game-updated', (req, res) => {
    const { gameId } = req.body;
    if (gameId) {
      const normalizedGameId = normalizeGameId(gameId);
      io.to(`game:${normalizedGameId}`).emit('game-updated', { gameId: normalizedGameId });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'gameId requis' });
    }
  });
}

module.exports = { setupEmitRoutes };

