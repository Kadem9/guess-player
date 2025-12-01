'use client';

import { useState, useEffect } from 'react';
import { Gamepad, Trophy, Users, Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RecentGame {
  id: string;
  code: string;
  createdAt: string;
  difficulty: string;
  maxTurns: number;
  currentTurn: number;
  userScore: number;
  winnerScore: number;
  isWinner: boolean;
  totalPlayers: number;
  winnerUsername: string | null;
}

export function RecentGames() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      fetchRecentGames();
    }
  }, [user, isLoading]);

  const fetchRecentGames = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/recent-games', {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.games) {
        setRecentGames(data.games);
      }
    } catch (error) {
      console.error('Erreur récupération parties récentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'Facile';
      case 'MEDIUM':
        return 'Moyen';
      case 'HARD':
        return 'Difficile';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="recent-games">
        <div className="recent-games__header">
          <Gamepad className="recent-games__icon" />
          <h2 className="recent-games__title">
            Parties récentes
          </h2>
        </div>
        <div className="recent-games__divider"></div>
        <div className="recent-games__empty">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="recent-games">
      <div className="recent-games__header">
        <Gamepad className="recent-games__icon" />
        <h2 className="recent-games__title">
          Parties récentes
        </h2>
      </div>
      <div className="recent-games__divider"></div>
      
      {recentGames.length === 0 ? (
        <div className="recent-games__empty">
          Aucune partie récente
        </div>
      ) : (
        <div className="recent-games__list">
          {recentGames.map((game) => (
            <div 
              key={game.id} 
              className="recent-games__item"
              onClick={() => router.push(`/game/${game.id}/results`)}
            >
              <div className="recent-games__item-header">
                <div className="recent-games__item-code">
                  {game.code}
                </div>
                {game.isWinner && (
                  <div className="recent-games__item-badge">
                    <Trophy className="recent-games__item-badge-icon" />
                    Victoire
                  </div>
                )}
              </div>

              <div className="recent-games__item-info">
                <div className="recent-games__item-stat">
                  <span className="recent-games__item-stat-label">Score:</span>
                  <span className={`recent-games__item-stat-value ${game.isWinner ? 'recent-games__item-stat-value--winner' : ''}`}>
                    {game.userScore} / {game.maxTurns}
                  </span>
                </div>

                <div className="recent-games__item-stat">
                  <Users className="recent-games__item-stat-icon" />
                  <span>{game.totalPlayers} joueur{game.totalPlayers > 1 ? 's' : ''}</span>
                </div>

                <div className="recent-games__item-stat">
                  <span className="recent-games__item-stat-label">Difficulté:</span>
                  <span>{getDifficultyLabel(game.difficulty)}</span>
                </div>

                <div className="recent-games__item-stat">
                  <Calendar className="recent-games__item-stat-icon" />
                  <span>{formatDate(game.createdAt)}</span>
                </div>
              </div>

              <div className="recent-games__item-arrow">
                <ArrowRight className="recent-games__item-arrow-icon" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

