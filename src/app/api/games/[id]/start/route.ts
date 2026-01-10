import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // vérifier auth
    const user = await verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const gameId = params.id;

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID de partie requis' },
        { status: 400 }
      );
    }

    // récup partie (support codes courts)
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

    // vérifier que user est hôte
    const hostPlayer = game.players.find(player => player.userId === user.id && player.isHost);
    if (!hostPlayer) {
      return NextResponse.json(
        { error: 'Seul l\'hôte peut démarrer la partie' },
        { status: 403 }
      );
    }

    // vérifier que partie est en attente
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Cette partie ne peut pas être démarrée' },
        { status: 400 }
      );
    }

    // vérifier qu'il y a min 2 joueurs
    if (game.players.length < 2) {
      return NextResponse.json(
        { error: 'Il faut au moins 2 joueurs pour commencer' },
        { status: 400 }
      );
    }

    // mettre à jour statut partie
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'IN_PROGRESS',
        currentTurn: 0,
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
        },
      },
    });

    // emit event socket via serveur backend
    try {
      const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
      await fetch(`${socketUrl}/emit/game-started`, {
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
      message: 'Partie démarrée avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors du démarrage de la partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
