import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';
import { getPlayersByDifficulty } from '@/utils/gameUtils';
import { Difficulty } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const gameId = params.id;

    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // Recherche de la partie
    let game;
    if (gameId.length === 8) {
      game = await prisma.game.findFirst({
        where: {
          OR: [
            { id: gameId },
            { id: { startsWith: gameId.toLowerCase() } }
          ]
        },
        include: {
          questions: true,
          players: true
        }
      });
    } else {
      game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          questions: true,
          players: true
        }
      });
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Partie non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est dans cette partie
    const userInGame = game.players.find(p => p.userId === user.id);
    if (!userInGame) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à voir cette partie' },
        { status: 403 }
      );
    }

    // Vérifier si une question existe déjà pour le tour actuel
    const currentRound = game.currentTurn + 1;
    const existingQuestion = game.questions.find(q => q.round === currentRound);

    if (existingQuestion) {
      // Une question existe déjà pour ce tour, la retourner
      const difficulty = game.difficulty as Difficulty;
      const allPlayers = getPlayersByDifficulty(difficulty);
      const existingPlayer = allPlayers.find(p => p.id === existingQuestion.playerId);
      
      if (existingPlayer) {
        return NextResponse.json({
          success: true,
          player: existingPlayer,
          alreadyExists: true
        });
      }
    }

    // Récupérer les joueurs déjà utilisés dans cette partie
    const usedPlayerIds = game.questions.map(q => q.playerId);
    
    // Obtenir tous les joueurs disponibles selon la difficulté
    const difficulty = game.difficulty as Difficulty;
    const allPlayers = getPlayersByDifficulty(difficulty);
    
    // Filtrer les joueurs non utilisés
    const availablePlayers = allPlayers.filter(p => !usedPlayerIds.includes(p.id));
    
    // Vérifier s'il reste assez de joueurs pour le tour suivant seulement
    // On continue tant qu'il reste au moins 1 joueur disponible
    if (availablePlayers.length === 0) {
      // Plus de joueurs disponibles, terminer la partie
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'FINISHED'
        }
      });
      
      return NextResponse.json({
        success: true,
        gameFinished: true,
        message: 'Plus assez de joueurs disponibles. La partie est terminée.'
      });
    }

    // Sélectionner un joueur aléatoire parmi les disponibles
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const selectedPlayer = availablePlayers[randomIndex];

    // Stocker la question dans la base de données
    await prisma.question.create({
      data: {
        gameId: game.id,
        playerId: selectedPlayer.id,
        round: currentRound
      }
    });

    return NextResponse.json({
      success: true,
      player: selectedPlayer,
      availablePlayers: availablePlayers.length,
      turnsRemaining: game.maxTurns - game.currentTurn
    });
  } catch (error: any) {
    console.error('Erreur récupération question:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

