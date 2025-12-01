'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

interface GameResultsProps {
  gameId: string;
}

export function GameResults({ gameId }: GameResultsProps) {
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
        const response = await fetch(`/api/games/${gameId}`, {
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
  }, [user, gameId]);

  const getRankIcon = (rank: number) => {
    if (rank === 0) {
      return <Trophy className="game-results__player-rank-icon game-results__player-rank-icon--gold" />;
    }
    if (rank === 1) {
      return <Medal className="game-results__player-rank-icon game-results__player-rank-icon--silver" />;
    }
    if (rank === 2) {
      return <Award className="game-results__player-rank-icon game-results__player-rank-icon--bronze" />;
    }
    return null;
  };

  const getPlayerClass = (rank: number, isCurrentUser: boolean) => {
    let baseClass = 'game-results__player';
    
    if (rank === 0) {
      baseClass += ' game-results__player--winner';
    } else if (rank === 1) {
      baseClass += ' game-results__player--second';
    } else if (rank === 2) {
      baseClass += ' game-results__player--third';
    } else {
      baseClass += ' game-results__player--default';
    }
    
    if (isCurrentUser) {
      baseClass += ' game-results__player--current';
    }
    
    return baseClass;
  };

  if (isLoading || loading) {
    return (
      <div className="u-flex u-flex--center u-min-h-screen">
        <div className="user-stats__spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  if (error || !game) {
    return (
      <main className="game-results">
        <button
          onClick={() => router.push('/dashboard')}
          className="game-play__back"
        >
          <ArrowLeft className="game-play__back-icon" />
          Retour au Dashboard
        </button>
        <div className="game-results__card">
          <div className="create-game__error">
            {error || 'Partie non trouvée'}
          </div>
        </div>
      </main>
    );
  }

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isWinner = winner?.userId === user.id;

  return (
    <main className="game-results">
      <div className="game-results__header">
        <h1 className="game-results__title">
          {isWinner ? 'Félicitations !' : 'Partie terminée !'}
        </h1>
        <p className="game-results__subtitle">
          {game.currentTurn} tours joués
        </p>
      </div>

      <div className="game-results__card">
        <h2 className="game-results__leaderboard-title">
          <Trophy className="game-results__leaderboard-icon" />
          Classement final
        </h2>

        <div className="game-results__leaderboard-list">
          {sortedPlayers.map((player, index) => {
            const isCurrentUser = player.userId === user.id;

            return (
              <div
                key={player.id}
                className={getPlayerClass(index, isCurrentUser)}
              >
                <div className="game-results__player-left">
                  <div className="game-results__player-rank">
                    {getRankIcon(index) || (
                      <span className="game-results__player-rank-number">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <div className="game-results__player-info">
                    <div className="game-results__player-name">
                      {player.user.prenom} {player.user.nom}
                      {isCurrentUser && ' (Vous)'}
                    </div>
                    <div className="game-results__player-username">
                      @{player.user.username}
                    </div>
                  </div>
                </div>
                <div className="game-results__player-right">
                  <div className="game-results__player-score">
                    {player.score}
                  </div>
                  <div className="game-results__player-score-label">
                    points
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="game-results__actions">
        <button
          onClick={() => router.push('/dashboard')}
          className="game-results__button game-results__button--primary"
        >
          <ArrowLeft className="game-play__back-icon" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Retour au Dashboard
        </button>
      </div>
    </main>
  );
}

