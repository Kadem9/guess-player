'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, User, Trophy, Gamepad2, TrendingUp, Award, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UserStatsData {
  partiesJouees: number;
  victoires: number;
  scoreTotal: number;
  scoreMoyen: number;
  defaites: number;
}

export function Profile() {
  const { user } = useAuth();
  const router = useRouter();
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
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) return null;

  const userInitials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
  const winRate = stats && stats.partiesJouees > 0 
    ? Math.round((stats.victoires / stats.partiesJouees) * 100) 
    : 0;

  return (
    <main className="profile">
      <div className="profile__container">
        <button
          onClick={() => router.push('/dashboard')}
          className="profile__back"
        >
          <ArrowLeft className="profile__back-icon" />
          Retour
        </button>

        <div className="profile__header">
          <div className="profile__avatar">
            {userInitials}
          </div>
          <div className="profile__info">
            <h1 className="profile__name">
              {user.prenom} {user.nom}
            </h1>
            <p className="profile__username">
              @{user.username}
            </p>
          </div>
        </div>

        <div className="profile__stats-grid">
          <div className="profile__stat-card">
            <div className="profile__stat-icon profile__stat-icon--blue">
              <Gamepad2 size={24} />
            </div>
            <div className="profile__stat-content">
              <p className="profile__stat-label">Parties jouées</p>
              <p className="profile__stat-value">
                {loading ? '...' : (stats?.partiesJouees || 0)}
              </p>
            </div>
          </div>

          <div className="profile__stat-card">
            <div className="profile__stat-icon profile__stat-icon--green">
              <Trophy size={24} />
            </div>
            <div className="profile__stat-content">
              <p className="profile__stat-label">Victoires</p>
              <p className="profile__stat-value">
                {loading ? '...' : (stats?.victoires || 0)}
              </p>
              {stats && stats.partiesJouees > 0 && (
                <p className="profile__stat-desc">
                  {winRate}% de réussite
                </p>
              )}
            </div>
          </div>

          <div className="profile__stat-card">
            <div className="profile__stat-icon profile__stat-icon--purple">
              <TrendingUp size={24} />
            </div>
            <div className="profile__stat-content">
              <p className="profile__stat-label">Score total</p>
              <p className="profile__stat-value">
                {loading ? '...' : (stats?.scoreTotal || 0)}
              </p>
              {stats && stats.scoreMoyen > 0 && (
                <p className="profile__stat-desc">
                  Moyenne: {stats.scoreMoyen} pts
                </p>
              )}
            </div>
          </div>

          {stats && stats.defaites > 0 && (
            <div className="profile__stat-card">
              <div className="profile__stat-icon profile__stat-icon--red">
                <Award size={24} />
              </div>
              <div className="profile__stat-content">
                <p className="profile__stat-label">Défaites</p>
                <p className="profile__stat-value">
                  {stats.defaites}
                </p>
              </div>
            </div>
          )}
        </div>

        {stats && stats.partiesJouees === 0 && (
          <div className="profile__empty">
            <Gamepad2 className="profile__empty-icon" size={48} />
            <h3 className="profile__empty-title">Aucune partie jouée</h3>
            <p className="profile__empty-text">
              Commencez à jouer pour voir vos statistiques !
            </p>
            <button
              onClick={() => router.push('/game/create')}
              className="profile__empty-button"
            >
              Créer une partie
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
