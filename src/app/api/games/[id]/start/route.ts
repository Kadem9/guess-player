import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function POST(
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

    // Récupérer la partie (support des codes courts)
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

    // Vérifier que l'utilisateur est l'hôte
    const hostPlayer = game.players.find(player => player.userId === user.id && player.isHost);
    if (!hostPlayer) {
      return NextResponse.json(
        { error: 'Seul l\'hôte peut démarrer la partie' },
        { status: 403 }
      );
    }

    // Vérifier que la partie est en attente
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Cette partie ne peut pas être démarrée' },
        { status: 400 }
      );
    }

    // Vérifier qu'il y a au moins 2 joueurs
    if (game.players.length < 2) {
      return NextResponse.json(
        { error: 'Il faut au moins 2 joueurs pour commencer' },
        { status: 400 }
      );
    }

    // Mettre à jour le statut de la partie
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'IN_PROGRESS',
        currentTurn: 0,
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: 'Partie démarrée avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors du démarrage de la partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
