// routes http pr emettre events socket io depuis api next js
function normalizeGameId(gameId) {
  return gameId.toLowerCase();
}

function setupEmitRoutes(app, io) {
  // route post pr emit game-started
  app.post('/emit/game-started', (req, res) => {
    const { gameId } = req.body;
    if (gameId) {
      const normalizedGameId = normalizeGameId(gameId);
      const room = `game:${normalizedGameId}`;
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      const count = socketsInRoom ? socketsInRoom.size : 0;
      io.to(room).emit('game-started', { gameId: normalizedGameId });
      res.json({ success: true, room, socketsCount: count });
    } else {
      res.status(400).json({ error: 'gameId requis' });
    }
  });

  // route post pr emit game-updated
  app.post('/emit/game-updated', (req, res) => {
    const { gameId } = req.body;
    if (gameId) {
      const normalizedGameId = normalizeGameId(gameId);
      const room = `game:${normalizedGameId}`;
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      const count = socketsInRoom ? socketsInRoom.size : 0;
      io.to(room).emit('game-updated', { gameId: normalizedGameId });
      res.json({ success: true, room, socketsCount: count });
    } else {
      res.status(400).json({ error: 'gameId requis' });
    }
  });

  // route post pr emit game-ended
  app.post('/emit/game-ended', (req, res) => {
    const { gameId } = req.body;
    if (gameId) {
      const normalizedGameId = normalizeGameId(gameId);
      const room = `game:${normalizedGameId}`;
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      const count = socketsInRoom ? socketsInRoom.size : 0;
      io.to(room).emit('game-finished', { gameId: normalizedGameId });
      res.json({ success: true, room, socketsCount: count });
    } else {
      res.status(400).json({ error: 'gameId requis' });
    }
  });
}

module.exports = { setupEmitRoutes };

