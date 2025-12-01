import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

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
    } else {
      game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
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
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Partie non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que la partie est en cours
    if (game.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'La partie n\'est pas en cours' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est dans la partie
    const playerInGame = game.players.find(p => p.userId === user.id);
    if (!playerInGame) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas dans cette partie' },
        { status: 403 }
      );
    }

    // Retirer le joueur qui abandonne
    await prisma.gamePlayer.delete({
      where: {
        id: playerInGame.id
      }
    });

    // Vérifier s'il reste des joueurs
    const remainingPlayers = game.players.filter(p => p.userId !== user.id);
    
    if (remainingPlayers.length === 0) {
      // Plus de joueurs, annuler la partie
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'CANCELLED'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Partie annulée (plus de joueurs)',
        gameFinished: true
      });
    }

    // Il reste au moins un joueur, donner la victoire au joueur avec le score le plus élevé
    const sortedPlayers = [...remainingPlayers].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    // Terminer la partie
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'FINISHED'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Vous avez déclaré forfait. La partie est terminée.',
      gameFinished: true,
      winner: {
        userId: winner.userId,
        username: winner.user.username,
        nom: winner.user.nom,
        prenom: winner.user.prenom,
        score: winner.score
      }
    });
  } catch (error: any) {
    console.error('Erreur abandon partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

