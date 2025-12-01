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
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'ID du joueur requis' },
        { status: 400 }
      );
    }

    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // Recherche de la partie
    let game;
    if (gameId.length === 8) {
      game = await prisma.game.findFirst({
        where: {
          OR: [
            { id: gameId },
            { id: { startsWith: gameId.toLowerCase() } }
          ]
        },
        include: {
          players: true
        }
      });
    } else {
      game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          players: true
        }
      });
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Partie non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que la partie n'est pas déjà commencée
    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Impossible de retirer un joueur d\'une partie en cours' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est l'hôte
    const isHost = game.players.some(p => p.userId === user.id && p.isHost);
    if (!isHost) {
      return NextResponse.json(
        { error: 'Seul l\'hôte peut retirer un joueur' },
        { status: 403 }
      );
    }

    // Vérifier que le joueur à retirer n'est pas l'hôte
    const playerToRemove = game.players.find(p => p.userId === playerId);
    if (!playerToRemove) {
      return NextResponse.json(
        { error: 'Joueur non trouvé dans cette partie' },
        { status: 404 }
      );
    }

    if (playerToRemove.isHost) {
      return NextResponse.json(
        { error: 'L\'hôte ne peut pas être retiré' },
        { status: 400 }
      );
    }

    // Retirer le joueur
    await prisma.gamePlayer.delete({
      where: {
        id: playerToRemove.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Joueur retiré avec succès'
    });
  } catch (error: any) {
    console.error('Erreur retrait joueur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

