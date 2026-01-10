import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const playerName = decodeURIComponent(params.name);
    
    // api thesportsdb pr images
    const apiUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la photo');
    }
    
    const data = await response.json();
    
    // chercher joueur le plus pertinent (relevance le plus élevé)
    if (data.player && data.player.length > 0) {
      // trier par relevance décroissante
      const sortedPlayers = data.player.sort((a: any, b: any) => {
        const relevanceA = parseFloat(a.relevance || '0');
        const relevanceB = parseFloat(b.relevance || '0');
        return relevanceB - relevanceA;
      });
      
      const bestMatch = sortedPlayers[0];
      
      // retourner photo cutout si disponible
      if (bestMatch.strCutout) {
        return NextResponse.json({
          success: true,
          photo: bestMatch.strCutout,
          player: {
            name: bestMatch.strPlayer,
            team: bestMatch.strTeam,
            position: bestMatch.strPosition,
            nationality: bestMatch.strNationality,
          }
        });
      }
    }
    
    // aucune photo trouvée
    return NextResponse.json({
      success: false,
      photo: null,
      message: 'Photo non disponible'
    });
    
  } catch (error: any) {
    console.error('Erreur récupération photo joueur:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur serveur',
        photo: null
      },
      { status: 500 }
    );
  }
}

