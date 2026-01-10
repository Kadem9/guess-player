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
    const body = await request.json();
    const { turn } = body;

    if (!turn) {
      return NextResponse.json(
        { error: 'Numéro de tour requis' },
        { status: 400 }
      );
    }

    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Erreur de connexion à la base de données:', error);
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    let game;
    if (gameId.length === 8) {
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

    const userInGame = game.players.find(player => player.userId === user.id);
    if (!userInGame) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier cette partie' },
        { status: 403 }
      );
    }

    // vérifier si on a atteint le nombre max de tours
    // maxTurns = tours par joueur, donc total = maxTurns * nombre de joueurs
    // currentTurn commence à 0, donc avec 2 joueurs et 5 tours/joueur = 10 tours (0-9)
    // la partie se termine quand currentTurn = 10 (après le 10ème tour)
    const totalTurnsNeeded = game.maxTurns * game.players.length;
    if (turn >= totalTurnsNeeded) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'FINISHED'
        }
      });

      // émettre event socket pr notifier tous les joueurs
      try {
        const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
        await fetch(`${socketUrl}/emit/game-ended`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id }),
        });
      } catch (error) {
        console.error('Erreur émission Socket.io:', error);
      }

      return NextResponse.json({
        success: true,
        gameFinished: true,
        message: 'Partie terminée (nombre de tours max atteint)'
      });
    }

    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        currentTurn: turn,
      },
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
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: 'Tour mis à jour avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du tour:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
