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

    // Récupérer les paramètres de la requête
    const body = await request.json();
    const { 
      maxPlayers = 4, 
      maxTurns = 10, 
      difficulty = 'MEDIUM', 
      timePerTurn = 30 
    } = body;

    // Créer une nouvelle partie
    const game = await prisma.game.create({
      data: {
        creatorId: user.id,
        status: 'WAITING',
        currentTurn: 0,
        maxPlayers,
        maxTurns,
        difficulty,
        timePerTurn,
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
      },
    });

    // Ajouter le créateur comme premier joueur (hôte)
    await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: user.id,
        isHost: true,
        score: 0,
      },
    });

    // Récupérer la partie avec les joueurs
    const gameWithPlayers = await prisma.game.findUnique({
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

    return NextResponse.json({
      success: true,
      game: gameWithPlayers,
      message: 'Partie créée avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la création de partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
