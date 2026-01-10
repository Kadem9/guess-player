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
          players: {
            include: {
              user: true
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
              user: true
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

    // vérifier que partie est en attente
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Impossible de quitter une partie en cours' },
        { status: 400 }
      );
    }

    // trouver joueur dans partie
    const playerInGame = game.players.find(p => p.userId === user.id);
    if (!playerInGame) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas dans cette partie' },
        { status: 403 }
      );
    }

    // si hôte essaie de quitter, annuler partie
    if (playerInGame.isHost) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'CANCELLED'
        }
      });

      // retirer tous les joueurs
      await prisma.gamePlayer.deleteMany({
        where: { gameId: game.id }
      });

      // emit event socket pr notifier les autres
      try {
        const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
        const response = await fetch(`${socketUrl}/emit/game-updated`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id }),
        });
        const result = await response.json();
      } catch (error) {
        console.error('[API] [LEAVE] Erreur émission Socket.io (hôte parti):', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Partie annulée (hôte parti)',
        gameCancelled: true
      });
    }

    // retirer joueur
    await prisma.gamePlayer.delete({
      where: {
        id: playerInGame.id
      }
    });

    // vérifier s'il reste assez de joueurs
    const remainingPlayers = game.players.filter(p => p.userId !== user.id);
    
    // si plus assez de joueurs, annuler partie
    if (remainingPlayers.length < 2) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'CANCELLED'
        }
      });

      // emit event socket pr notifier les autres
      try {
        const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
        const response = await fetch(`${socketUrl}/emit/game-updated`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id }),
        });
        const result = await response.json();
      } catch (error) {
        console.error('[API] [LEAVE] Erreur émission Socket.io (pas assez joueurs):', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Partie annulée (plus assez de joueurs)',
        gameCancelled: true
      });
    }

    // emit event socket pr notifier les autres joueurs
    try {
      const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001';
      const response = await fetch(`${socketUrl}/emit/game-updated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      });
      const result = await response.json();
    } catch (error) {
      console.error('[API] [LEAVE] Erreur émission Socket.io (joueur quitte):', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Vous avez quitté la partie',
      remainingPlayers: remainingPlayers.length
    });
  } catch (error: any) {
    console.error('Erreur quitter partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
