import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
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

    // Vérifier la connexion à la base de données
    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Erreur de connexion à la base de données:', error);
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // Récupérer la partie avec tous les détails (support des codes courts)
    let game;
    if (gameId.length === 8) {
      // Recherche par les 8 premiers caractères
      game = await prisma.game.findFirst({
        where: { 
          id: {
            startsWith: gameId.toLowerCase()
          }
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
          questions: {
            orderBy: {
              round: 'asc',
            },
          },
        },
      });
    } else {
      // Recherche par ID complet
      game = await prisma.game.findUnique({
        where: { id: gameId },
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
          questions: {
            orderBy: {
              round: 'asc',
            },
          },
        },
      });
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Partie introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est dans cette partie
    const userInGame = game.players.find(player => player.userId === user.id);
    if (!userInGame) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à voir cette partie' },
        { status: 403 }
      );
    }

    // Déterminer si l'utilisateur est l'hôte
    const isHost = userInGame.isHost;

    // Calculer les victoires pour chaque joueur
    // Récupérer toutes les parties terminées pour calculer les victoires
    const finishedGames = await prisma.game.findMany({
      where: {
        status: 'FINISHED'
      },
      include: {
        players: true
      }
    });

    // Calculer les victoires pour chaque joueur de la partie actuelle
    const playersWithStats = await Promise.all(
      game.players.map(async (player) => {
        let victories = 0;

        finishedGames.forEach(finishedGame => {
          const playerInGame = finishedGame.players.find(p => p.userId === player.userId);
          if (playerInGame) {
            // Trier les joueurs par score pour déterminer le gagnant
            const sortedPlayers = [...finishedGame.players].sort((a, b) => b.score - a.score);
            const winner = sortedPlayers[0];
            const secondPlace = sortedPlayers[1];
            
            // Une victoire compte seulement si :
            // 1. Le joueur est premier
            // 2. Il a un score > 0
            // 3. Il a un score strictement supérieur au deuxième (pas d'égalité)
            if (winner && 
                winner.userId === player.userId && 
                winner.score > 0 &&
                (!secondPlace || winner.score > secondPlace.score)) {
              victories++;
            }
          }
        });

        return {
          ...player,
          victories
        };
      })
    );

    // Remplacer les joueurs par ceux avec les statistiques
    const gameWithStats = {
      ...game,
      players: playersWithStats
    };

    return NextResponse.json({
      success: true,
      game: gameWithStats,
      isHost,
      currentUser: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        username: user.username,
      },
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
