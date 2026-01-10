import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// route appelée par le serveur socket qd un joueur se déconnecte
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, socketSecret } = body;

    // vérifier le secret (sécurité basique)
    const expectedSecret = process.env.SOCKET_SECRET || 'socket-internal-secret';
    if (socketSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
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
    const game = await prisma.game.findFirst({
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

    if (!game) {
      return NextResponse.json(
        { error: 'Partie non trouvée' },
        { status: 404 }
      );
    }

    // vérifier que partie est en attente
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Partie pas en attente' },
        { status: 400 }
      );
    }

    // trouver joueur dans partie
    const playerInGame = game.players.find(p => p.userId === userId);
    if (!playerInGame) {
      return NextResponse.json(
        { error: 'Joueur pas dans cette partie' },
        { status: 404 }
      );
    }

    // ne pas retirer l'hôte
    if (playerInGame.isHost) {
      return NextResponse.json(
        { error: 'Hôte ne peut pas être retiré' },
        { status: 400 }
      );
    }

    // retirer joueur
    await prisma.gamePlayer.delete({
      where: {
        id: playerInGame.id
      }
    });


    return NextResponse.json({
      success: true,
      message: 'Joueur retiré'
    });
  } catch (error: any) {
    console.error('[API] [SOCKET-DISCONNECT] Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
