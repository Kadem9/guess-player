import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId } = body;

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

    // Vérifier que la partie existe (support des codes courts)
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
          players: true,
        },
      });
    } else {
      // Recherche par ID complet
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

    // Vérifier que la partie est en attente
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Cette partie n\'accepte plus de nouveaux joueurs' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà dans la partie
    const existingPlayer = game.players.find(player => player.userId === user.id);
    if (existingPlayer) {
      // Le joueur est déjà dans la partie, on retourne la partie complète
      const fullGame = await prisma.game.findUnique({
        where: { id: game.id },
        include: {
          creator: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              username: true,
            }
          },
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
      return NextResponse.json({
        success: true,
        game: fullGame,
        alreadyInGame: true,
        message: 'Vous êtes déjà dans cette partie'
      });
    }

    // Vérifier le nombre maximum de joueurs
    if (game.players.length >= game.maxPlayers) {
      return NextResponse.json(
        { error: 'Cette partie est complète' },
        { status: 400 }
      );
    }

    // Ajouter le joueur à la partie
    const gamePlayer = await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: user.id,
        isHost: false,
        score: 0,
      },
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
    });

    // Récupérer la partie mise à jour avec tous les joueurs
    const updatedGame = await prisma.game.findUnique({
      where: { id: game.id },
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

    // TODO: fr un événement Socket.IO pour notifier les autres joueurs

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: 'Vous avez rejoint la partie avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la connexion à la partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
