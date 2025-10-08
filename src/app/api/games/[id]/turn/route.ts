import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTokenFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const gameId = params.id;
    const body = await request.json();
    const { turn } = body;

    if (!turn) {
      return NextResponse.json(
        { error: 'Numéro de tour requis' },
        { status: 400 }
      );
    }

    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Erreur de connexion à la base de données:', error);
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    let game;
    if (gameId.length === 8) {
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

    const userInGame = game.players.find(player => player.userId === user.id);
    if (!userInGame) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier cette partie' },
        { status: 403 }
      );
    }

    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        currentTurn: turn,
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
      },
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: 'Tour mis à jour avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du tour:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
