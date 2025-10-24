'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaTrophy, FaMedal, FaStar } from 'react-icons/fa';
import Link from 'next/link';

interface GamePlayer {
  id: string;
  userId: string;
  score: number;
  user: {
    id: string;
    nom: string;
    prenom: string;
    username: string;
  };
}

interface Game {
  id: string;
  status: string;
  currentTurn: number;
  maxTurns: number;
  players: GamePlayer[];
}

export default function GameResultsPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${params.id}`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du chargement');
        }

        setGame(data.game);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGame();
    }
  }, [user, params.id]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) return null;

  if (error || !game) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/dashboard" className="btn btn-ghost mb-6">
            <FaArrowLeft /> Retour au Dashboard
          </Link>
          <div className="alert alert-error">
            <span>{error || 'Partie non trouvée'}</span>
          </div>
        </div>
      </div>
    );
  }

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isWinner = winner?.userId === user.id;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {isWinner ? 'Félicitations !' : 'Partie terminée !'}
          </h1>
          <p className="text-lg text-base-content/70">
            {game.currentTurn} tours joués
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6 justify-center">
              <FaTrophy className="text-warning" /> Classement final
            </h2>

            <div className="space-y-4">
              {sortedPlayers.map((player, index) => {
                const isCurrentUser = player.userId === user.id;
                const medals = [
                  { icon: FaTrophy, color: 'text-warning', bg: 'bg-warning/20' },
                  { icon: FaMedal, color: 'text-base-content/60', bg: 'bg-base-content/10' },
                  { icon: FaStar, color: 'text-amber-600', bg: 'bg-amber-600/20' },
                ];
                const medal = medals[index];

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-6 rounded-lg ${
                      isCurrentUser
                        ? 'bg-primary/20 border-2 border-primary'
                        : index === 0
                        ? medal.bg
                        : 'bg-base-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold">
                        {index === 0 && <FaTrophy className={medal.color} />}
                        {index === 1 && <FaMedal className={medal.color} />}
                        {index === 2 && <FaStar className={medal.color} />}
                        {index > 2 && <span className="text-base-content/50">#{index + 1}</span>}
                      </div>
                      <div>
                        <div className="font-bold text-lg">
                          {player.user.prenom} {player.user.nom}
                          {isCurrentUser && ' (Vous)'}
                        </div>
                        <div className="text-sm text-base-content/60">@{player.user.username}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{player.score}</div>
                      <div className="text-sm text-base-content/60">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            <FaArrowLeft /> Retour au Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

