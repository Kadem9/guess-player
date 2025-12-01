'use client';

import { GamePlay } from '@/components/game/GamePlay';

export default function PlayGamePage({ params }: { params: { id: string } }) {
  return <GamePlay gameId={params.id} />;
}
