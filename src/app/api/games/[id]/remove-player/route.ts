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
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'ID du joueur requis' },
        { status: 400 }
      );
    }

    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // recherche partie
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
          players: true
        }
      });
    } else {
      game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
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

    // vérifier que partie n'est pas déjà commencée
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Impossible de retirer un joueur d\'une partie en cours' },
        { status: 400 }
      );
    }

    // vérifier que user est hôte
    const isHost = game.players.some(p => p.userId === user.id && p.isHost);
    if (!isHost) {
      return NextResponse.json(
        { error: 'Seul l\'hôte peut retirer un joueur' },
        { status: 403 }
      );
    }

    // vérifier que joueur à retirer n'est pas hôte
    const playerToRemove = game.players.find(p => p.id === playerId);
    if (!playerToRemove) {
      return NextResponse.json(
        { error: 'Joueur non trouvé dans cette partie' },
        { status: 404 }
      );
    }

    if (playerToRemove.isHost) {
      return NextResponse.json(
        { error: 'L\'hôte ne peut pas être retiré' },
        { status: 400 }
      );
    }

    // retirer joueur
    await prisma.gamePlayer.delete({
      where: {
        id: playerToRemove.id
      }
    });

    // note: on ne change pas le statut de la partie
    // elle reste en WAITING même s'il reste moins de 2 joueurs
    // l'hôte pourra toujours inviter d'autres joueurs
    // le bouton "Lancer" sera désactivé si moins de 2 joueurs

    // émettre event socket pr notifier les autres
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
      message: 'Joueur retiré avec succès'
    });
  } catch (error: any) {
    console.error('Erreur retrait joueur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

