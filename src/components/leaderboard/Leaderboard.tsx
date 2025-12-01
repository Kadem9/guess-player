'use client';

import { ArrowLeft, Trophy, Award, Medal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  nom: string;
  prenom: string;
  totalScore: number;
  gamesPlayed: number;
  wins: number;
}

export function Leaderboard() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/scores/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="leaderboard__rank-icon leaderboard__rank-icon--gold" />;
    }
    if (rank === 2) {
      return <Medal className="leaderboard__rank-icon leaderboard__rank-icon--silver" />;
    }
    if (rank === 3) {
      return <Award className="leaderboard__rank-icon leaderboard__rank-icon--bronze" />;
    }
    return null;
  };

  const getPlayerClass = (rank: number) => {
    if (rank === 1) return 'leaderboard__player leaderboard__player--first';
    if (rank === 2) return 'leaderboard__player leaderboard__player--second';
    return 'leaderboard__player leaderboard__player--default';
  };

  return (
    <main className="leaderboard">
      <button
        onClick={() => router.push('/dashboard')}
        className="leaderboard__back"
      >
        <ArrowLeft className="leaderboard__back-icon" />
        Retour au Dashboard
      </button>

      <div className="leaderboard__card">
        <h1 className="leaderboard__title">
          Top 5 Mondial
        </h1>

        {isLoading ? (
          <div className="leaderboard__loading">
            <div className="user-stats__spinner"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="leaderboard__empty">
            <Trophy className="leaderboard__empty-icon" />
            <p className="leaderboard__empty-title">
              Aucun score enregistré pour le moment
            </p>
            <p className="leaderboard__empty-text">
              Soyez le premier à jouer !
            </p>
          </div>
        ) : (
          <div className="leaderboard__list">
            {leaderboard.map((player) => (
              <div
                key={player.rank}
                className={getPlayerClass(player.rank)}
              >
                <div className="leaderboard__player-content">
                  <div className="leaderboard__player-left">
                    <div className="leaderboard__rank-wrapper">
                      {getRankIcon(player.rank) || (
                        <span className="leaderboard__rank-number">
                          {player.rank}
                        </span>
                      )}
                    </div>

                    <div className="leaderboard__player-info">
                      <p className="leaderboard__player-name">
                        {player.prenom} {player.nom}
                      </p>
                      <p className="leaderboard__player-username">
                        @{player.username}
                      </p>
                    </div>
                  </div>

                  <div className="leaderboard__player-stats">
                    <div className="leaderboard__stat">
                      <p className="leaderboard__stat-label">
                        Score total
                      </p>
                      <p className="leaderboard__stat-value">
                        {player.totalScore}
                      </p>
                    </div>

                    <div className="leaderboard__stat">
                      <p className="leaderboard__stat-label">
                        Victoires
                      </p>
                      <p className="leaderboard__stat-value">
                        {player.wins}
                      </p>
                    </div>

                    <div className="leaderboard__stat">
                      <p className="leaderboard__stat-label">
                        Parties
                      </p>
                      <p className="leaderboard__stat-value">
                        {player.gamesPlayed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

