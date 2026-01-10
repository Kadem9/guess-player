import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // vérifier auth
    const user = await verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID de partie requis' },
        { status: 400 }
      );
    }

    // vérifier que partie existe (support codes courts)
    let game;
    if (gameId.length === 8) {
      // recherche par 8 premiers caractères
      game = await prisma.game.findFirst({
        where: { 
          id: {
            startsWith: gameId.toLowerCase()
          }
        },
        include: {
          players: true,
        },
      });
    } else {
      // recherche par id complet
      game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          players: true,
        },
      });
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Partie introuvable' },
        { status: 404 }
      );
    }

    // vérifier que partie est en attente
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Cette partie n\'accepte plus de nouveaux joueurs' },
        { status: 400 }
      );
    }

    // vérifier que user n'est pas déjà dans partie
    const existingPlayer = game.players.find(player => player.userId === user.id);
    if (existingPlayer) {
      // joueur déjà dans partie, retourner partie complète
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
      return NextResponse.json({
        success: true,
        game: fullGame,
        alreadyInGame: true,
        message: 'Vous êtes déjà dans cette partie'
      });
    }

    // vérifier nombre max joueurs
    if (game.players.length >= game.maxPlayers) {
      return NextResponse.json(
        { error: 'Cette partie est complète' },
        { status: 400 }
      );
    }

    // ajouter joueur à partie
    const gamePlayer = await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: user.id,
        isHost: false,
        score: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          },
        },
      },
    });

    // récup partie mise à jour avec tous joueurs
    const updatedGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            username: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // emit event socket via serveur backend
    try {
      const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
      await fetch(`${socketUrl}/emit/game-updated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      });
    } catch (error) {
      console.error('Erreur émission Socket.io:', error);
    }

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: 'Vous avez rejoint la partie avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la connexion à la partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
