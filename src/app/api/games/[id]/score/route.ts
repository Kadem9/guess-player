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
    const { playerId, isCorrect } = body;

    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    let game;
    if (gameId.length === 8) {
      game = await prisma.game.findFirst({
        where: { id: { startsWith: gameId.toLowerCase() } },
        include: { players: true },
      });
    } else {
      game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      });
    }

    if (!game) {
      return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 });
    }

    if (!isCorrect) {
      return NextResponse.json({
        success: true,
        message: 'Réponse incorrecte'
      });
    }

    const gamePlayer = await prisma.gamePlayer.findFirst({
      where: {
        gameId: game.id,
        userId: playerId
      }
    });

    if (!gamePlayer) {
      return NextResponse.json(
        { error: 'Joueur non trouvé dans la partie' },
        { status: 404 }
      );
    }

    await prisma.gamePlayer.update({
      where: { id: gamePlayer.id },
      data: {
        score: {
          increment: 1
        }
      }
    });

    const updatedGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        creator: {
          select: { id: true, nom: true, prenom: true, username: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, username: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: 'Score mis à jour',
    });
  } catch (error: any) {
    console.error('Erreur mise à jour score:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
