import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

// route pr vérifier si user est dans une partie en attente ou en cours
export async function GET(request: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // chercher partie active (WAITING ou IN_PROGRESS) où user est joueur
    const activeGamePlayer = await prisma.gamePlayer.findFirst({
      where: {
        userId: user.id,
        game: {
          status: {
            in: ['WAITING', 'IN_PROGRESS']
          }
        }
      },
      include: {
        game: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!activeGamePlayer) {
      return NextResponse.json({
        hasActiveGame: false,
        game: null
      });
    }

    return NextResponse.json({
      hasActiveGame: true,
      game: {
        id: activeGamePlayer.game.id,
        code: activeGamePlayer.game.id.slice(0, 8).toUpperCase(),
        status: activeGamePlayer.game.status,
        isHost: activeGamePlayer.isHost
      }
    });
  } catch (error: any) {
    console.error('Erreur vérification partie active:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
