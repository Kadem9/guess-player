'use client';

import { GameResults } from '@/components/game/GameResults';

export default function GameResultsPage({ params }: { params: { id: string } }) {
  return <GameResults gameId={params.id} />;
}

