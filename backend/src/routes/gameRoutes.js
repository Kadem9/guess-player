const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  createGame,
  joinGame,
  getGame,
  startGame,
  updateScore,
  updateTurn,
  finishGame,
  removePlayer
} = require('../controllers/gameController');

// chq route utilise le middleware d'authentification donc nécéssite un token valide
router.use(authMiddleware);

// tt les routes pour jouer à une partie
router.post('/create', createGame);
router.post('/join', joinGame);
router.get('/:id', getGame);
router.post('/:id/start', startGame);
router.post('/:id/score', updateScore);
router.post('/:id/turn', updateTurn);
router.post('/:id/finish', finishGame);
router.post('/:id/remove-player', removePlayer);

module.exports = router;


