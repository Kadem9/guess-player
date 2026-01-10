import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

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

    // récup toutes parties terminées où user a joué
    const finishedGames = await prisma.game.findMany({
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
      }
    });

    // calculer stats
    const partiesJouees = finishedGames.length;
    
    let victoires = 0;
    let scoreTotal = 0;
    let scoreMoyen = 0;

    finishedGames.forEach(game => {
      // trouver joueur dans cette partie
      const playerInGame = game.players.find(p => p.userId === user.id);
      if (playerInGame) {
        scoreTotal += playerInGame.score;

        // vérifier si c'est victoire (score le plus élevé)
        const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];
        const secondPlace = sortedPlayers[1];
        
        // victoire compte seulement si :
        // 1. joueur est premier
        // 2. il a score > 0
        // 3. il a score strictement supérieur au deuxième (pas égalité)
        if (winner && 
            winner.userId === user.id && 
            winner.score > 0 &&
            (!secondPlace || winner.score > secondPlace.score)) {
          victoires++;
        }
      }
    });

    if (partiesJouees > 0) {
      scoreMoyen = Math.round((scoreTotal / partiesJouees) * 10) / 10; // Arrondir à 1 décimale
    }

    return NextResponse.json({
      success: true,
      stats: {
        partiesJouees,
        victoires,
        scoreTotal,
        scoreMoyen,
        defaites: partiesJouees - victoires
      }
    });
  } catch (error: any) {
    console.error('Erreur récupération statistiques:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

