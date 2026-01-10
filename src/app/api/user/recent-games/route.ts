import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    // récup 3 dernières parties terminées où user a joué
    const recentGames = await prisma.game.findMany({
      where: {
        status: 'FINISHED',
        players: {
          some: {
            userId: user.id
          }
        }
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    // formater données pr front
    const formattedGames = recentGames.map(game => {
      // trouver joueur de user dans cette partie
      const userPlayer = game.players.find(p => p.userId === user.id);
      
      // déterminer gagnant
      const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
      const winner = sortedPlayers[0];
      const isWinner = winner && winner.userId === user.id;

      return {
        id: game.id,
        code: game.id.slice(0, 8).toUpperCase(),
        createdAt: game.createdAt,
        difficulty: game.difficulty,
        maxTurns: game.maxTurns,
        currentTurn: game.currentTurn,
        userScore: userPlayer?.score || 0,
        winnerScore: winner?.score || 0,
        isWinner,
        totalPlayers: game.players.length,
        winnerUsername: winner?.user?.username || null,
      };
    });

    return NextResponse.json({
      success: true,
      games: formattedGames
    });
  } catch (error: any) {
    console.error('Erreur récupération parties récentes:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

