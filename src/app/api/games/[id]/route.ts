import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function GET(
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

    // vérifier connexion bdd
    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Erreur de connexion à la base de données:', error);
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // récup partie avec tous détails (support codes courts)
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
      // recherche par id complet
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

    // vérifier que user est dans cette partie ou est le créateur
    const userInGame = game.players.find(player => player.userId === user.id);
    const isCreator = game.creatorId === user.id;
    
    // permettre accès si user est dans partie OU si partie annulée et user est créateur
    if (!userInGame && !(game.status === 'CANCELLED' && isCreator)) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à voir cette partie' },
        { status: 403 }
      );
    }

    // déterminer si user est hôte (soit via player, soit créateur si partie annulée)
    const isHost = userInGame?.isHost || (game.status === 'CANCELLED' && isCreator);

    // calculer victoires pr chaque joueur
    // récup toutes parties terminées pr calculer victoires
    const finishedGames = await prisma.game.findMany({
      where: {
        status: 'FINISHED'
      },
      include: {
        players: true
      }
    });

    // calculer victoires pr chaque joueur de partie actuelle
    // si partie annulée et pas de joueurs, retourner tableau vide
    const playersWithStats = game.players.length > 0 
      ? await Promise.all(
          game.players.map(async (player) => {
            let victories = 0;

            finishedGames.forEach(finishedGame => {
              const playerInGame = finishedGame.players.find(p => p.userId === player.userId);
              if (playerInGame) {
                // trier joueurs par score pr déterminer gagnant
                const sortedPlayers = [...finishedGame.players].sort((a, b) => b.score - a.score);
                const winner = sortedPlayers[0];
                const secondPlace = sortedPlayers[1];
                
                // victoire compte seulement si :
                // 1. joueur est premier
                // 2. il a score > 0
                // 3. il a score strictement supérieur au deuxième (pas égalité)
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
        )
      : [];

    // remplacer joueurs par ceux avec stats
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
