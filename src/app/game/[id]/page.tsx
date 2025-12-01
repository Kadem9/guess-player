'use client';

import { GameLobby } from '@/components/game/GameLobby';

export default function GamePage({ params }: { params: { id: string } }) {
  return <GameLobby gameId={params.id} />;
}
