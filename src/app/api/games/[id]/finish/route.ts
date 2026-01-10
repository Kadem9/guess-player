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

    try {
      await prisma.$connect();
    } catch (error) {
      return NextResponse.json(
        { error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // recherche partie
    let game;
    if (gameId.length === 8) {
      game = await prisma.game.findFirst({
        where: {
          OR: [
            { id: gameId },
            { id: { startsWith: gameId.toLowerCase() } }
          ]
        }
      });
    } else {
      game = await prisma.game.findUnique({
        where: { id: gameId }
      });
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Partie non trouvée' },
        { status: 404 }
      );
    }

    // terminer partie
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'FINISHED'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Partie terminée avec succès'
    });
  } catch (error: any) {
    console.error('Erreur fin de partie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}


