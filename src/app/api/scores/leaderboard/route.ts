import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // récup toutes parties terminées avec leurs joueurs
    const finishedGames = await prisma.game.findMany({
      where: {
        status: 'FINISHED'
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

    // calculer stats pr chaque joueur
    const playerStats = new Map<string, {
      userId: string;
      username: string;
      nom: string;
      prenom: string;
      totalScore: number;
      gamesPlayed: number;
      wins: number;
    }>();

    finishedGames.forEach(game => {
      // trier joueurs par score pr déterminer gagnant
      const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
      const winner = sortedPlayers[0];

      game.players.forEach(player => {
        const userId = player.userId;
        const user = player.user;

        if (!playerStats.has(userId)) {
          playerStats.set(userId, {
            userId,
            username: user.username,
            nom: user.nom,
            prenom: user.prenom,
            totalScore: 0,
            gamesPlayed: 0,
            wins: 0,
          });
        }

        const stats = playerStats.get(userId)!;
        stats.totalScore += player.score;
        stats.gamesPlayed += 1;

        // si c'est gagnant de cette partie
        if (winner && winner.userId === userId) {
          stats.wins += 1;
        }
      });
    });

    // convertir en tableau et trier par score total (puis par victoires en cas égalité)
    const leaderboard = Array.from(playerStats.values())
      .sort((a, b) => {
        // d'abord par score total
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // en cas égalité, par nombre victoires
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        // en cas égalité encore, par nombre parties jouées
        return b.gamesPlayed - a.gamesPlayed;
      })
      .slice(0, 5) // top 5 seulement
      .map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        nom: entry.nom,
        prenom: entry.prenom,
        totalScore: entry.totalScore,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
      }));

    return NextResponse.json({
      success: true,
      leaderboard
    });
  } catch (error: any) {
    console.error('Erreur récupération classement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

