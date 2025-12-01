'use client';

import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserStatsData {
  partiesJouees: number;
  victoires: number;
  scoreTotal: number;
  scoreMoyen: number;
  defaites: number;
}

export function UserStats() {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Erreur récupération statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="user-stats">
      <div className="user-stats__header">
        <Trophy className="user-stats__icon" />
        <h2 className="user-stats__title">
          Vos statistiques
        </h2>
      </div>
      <div className="user-stats__divider"></div>
      
      {loading ? (
        <div className="user-stats__loading">
          <div className="user-stats__spinner"></div>
        </div>
      ) : (
        <div className="user-stats__list">
          <div className="user-stats__stat">
            <div className="user-stats__stat-title">Parties jouées</div>
            <div className="user-stats__stat-value">
              {stats?.partiesJouees || 0}
            </div>
          </div>
          
          <div className="user-stats__stat">
            <div className="user-stats__stat-title">Victoires</div>
            <div className="user-stats__stat-value user-stats__stat-value--success">
              {stats?.victoires || 0}
            </div>
            {stats && stats.partiesJouees > 0 && (
              <div className="user-stats__stat-desc">
                {Math.round((stats.victoires / stats.partiesJouees) * 100)}% de victoires
              </div>
            )}
          </div>
          
          <div className="user-stats__stat">
            <div className="user-stats__stat-title">Score total</div>
            <div className="user-stats__stat-value user-stats__stat-value--primary">
              {stats?.scoreTotal || 0}
            </div>
            {stats && stats.scoreMoyen > 0 && (
              <div className="user-stats__stat-desc">
                Moyenne: {stats.scoreMoyen} pts/partie
              </div>
            )}
          </div>

          {stats && stats.defaites > 0 && (
            <div className="user-stats__stat">
              <div className="user-stats__stat-title">Défaites</div>
              <div className="user-stats__stat-value user-stats__stat-value--error">
                {stats.defaites}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

