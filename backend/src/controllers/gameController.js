const { prisma } = require('../lib/prisma');

// création d'une nouvelle partie
async function createGame(req, res) {
  try {
    const userId = req.user.id;
    const { maxPlayers = 4, maxTurns = 10, difficulty = 'MEDIUM', timePerTurn = 30 } = req.body;

    const game = await prisma.game.create({
      data: {
        creatorId: userId,
        status: 'WAITING',
        currentTurn: 0,
        maxPlayers,
        maxTurns,
        difficulty,
        timePerTurn,
      },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          }
        }
      }
    });

    // ici on ajoute le créateur comme joueur
    await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: userId,
        isHost: true,
        score: 0,
      }
    });

    // on récupère la partie complète avec ts les joueurs
    const fullGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          }
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                username: true,
              }
            }
          }
        }
      }
    });

    res.json({ game: fullGame });
  } catch (error) {
    console.error('Erreur création partie:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la partie' });
  }
}

// rejoindre une partie
async function joinGame(req, res) {
  try {
    const { gameId } = req.body;
    const userId = req.user.id;

    if (!gameId) {
      return res.status(400).json({ error: 'Code de partie requis' });
    }

    // puis on cherche la partie par 'id' complet ou par les 8 premiers caractères
    let game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: gameId },
          { id: { startsWith: gameId } }
        ],
        status: 'WAITING'
      },
      include: {
        players: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // on vérifie si le joueur est déjà dans la partie
    const alreadyJoined = game.players.some(p => p.userId === userId);
    if (alreadyJoined) {
      // le joueur est déjà dans la partie, on le redirige simplement
      const fullGame = await prisma.game.findUnique({
        where: { id: game.id },
        include: {
          creator: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              username: true,
            }
          },
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  username: true,
                }
              }
            }
          }
        }
      });
      return res.json({ game: fullGame, alreadyInGame: true });
    }

    // et on véirfie si la partie est déjà pleine
    if (game.players.length >= game.maxPlayers) {
      return res.status(400).json({ error: 'Partie pleine' });
    }

    // on ajoute le joueur
    await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: userId,
        isHost: false,
        score: 0,
      }
    });

    // et on récupère la partie complète
    const fullGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          }
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                username: true,
              }
            }
          }
        }
      }
    });

    res.json({ game: fullGame });
  } catch (error) {
    console.error('Erreur rejoindre partie:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion à la partie' });
  }
}

// obtenir les détails d'une partie
async function getGame(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // on cherche par 'id' complet ou par les 8 premiers caractères
    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          }
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                username: true,
              }
            }
          }
        },
        questions: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // on vérifie si l'utilisateur est l'hôte
    const isHost = game.players.some(p => p.userId === userId && p.isHost);

    res.json({ game, isHost });
  } catch (error) {
    console.error('Erreur récupération partie:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la partie' });
  }
}

// démarrage d'une partie
async function startGame(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // recherche de la partie
    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      },
      include: {
        players: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // on vérifie si l'utilisateur est l'hôte
    const isHost = game.players.some(p => p.userId === userId && p.isHost);
    if (!isHost) {
      return res.status(403).json({ error: 'Seul l\'hôte peut démarrer la partie' });
    }

    // on vérifie qu'il y a au moins 2 joueurs
    if (game.players.length < 2) {
      return res.status(400).json({ error: 'Au moins 2 joueurs sont nécessaires' });
    }

    // démarrarage de la partie
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'IN_PROGRESS',
        currentTurn: 0
      },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          }
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                username: true,
              }
            }
          }
        }
      }
    });

    res.json({ game: updatedGame });
  } catch (error) {
    console.error('Erreur démarrage partie:', error);
    res.status(500).json({ error: 'Erreur lors du démarrage de la partie' });
  }
}

// maj du score
async function updateScore(req, res) {
  try {
    const { id } = req.params;
    const { playerId, isCorrect } = req.body;

    if (!isCorrect) {
      return res.json({ success: true });
    }

    // recherche du joueur
    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    const gamePlayer = await prisma.gamePlayer.findFirst({
      where: {
        gameId: game.id,
        userId: playerId
      }
    });

    if (!gamePlayer) {
      return res.status(404).json({ error: 'Joueur non trouvé dans la partie' });
    }

    // +1 au score
    await prisma.gamePlayer.update({
      where: { id: gamePlayer.id },
      data: {
        score: {
          increment: 1
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur maj score:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du score' });
  }
}

// chmt de tour
async function updateTurn(req, res) {
  try {
    const { id } = req.params;
    const { turn } = req.body;

    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    await prisma.game.update({
      where: { id: game.id },
      data: {
        currentTurn: turn
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur changement tour:', error);
    res.status(500).json({ error: 'Erreur lors du changement de tour' });
  }
}

// terminer une partie
async function finishGame(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // on cherche la partie
    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // on termine la partie
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'FINISHED'
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur fin de partie:', error);
    res.status(500).json({ error: 'Erreur lors de la fin de partie' });
  }
}

// Exclure un joueur d'une partie
async function removePlayer(req, res) {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    const userId = req.user.id;

    // on cherche la partie
    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { id: { startsWith: id } }
        ]
      },
      include: {
        players: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    // on vérifie que la partie n'est pas déjà commencée
    if (game.status !== 'WAITING') {
      return res.status(400).json({ error: 'Impossible de retirer un joueur d\'une partie en cours' });
    }

    // on vérifie que l'utilisateur est l'hôte
    const isHost = game.players.some(p => p.userId === userId && p.isHost);
    if (!isHost) {
      return res.status(403).json({ error: 'Seul l\'hôte peut retirer un joueur' });
    }

    // on vérifie que le joueur à retirer n'est pas l'hôte
    const playerToRemove = game.players.find(p => p.userId === playerId);
    if (!playerToRemove) {
      return res.status(404).json({ error: 'Joueur non trouvé dans cette partie' });
    }

    if (playerToRemove.isHost) {
      return res.status(400).json({ error: 'L\'hôte ne peut pas être retiré' });
    }

    // on retire le joueur
    await prisma.gamePlayer.delete({
      where: {
        id: playerToRemove.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur retrait joueur:', error);
    res.status(500).json({ error: 'Erreur lors du retrait du joueur' });
  }
}

// j'exporte les fonctions
module.exports = {
  createGame,
  joinGame,
  getGame,
  startGame,
  updateScore,
  updateTurn,
  finishGame,
  removePlayer
};


