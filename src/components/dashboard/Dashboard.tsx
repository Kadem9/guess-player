'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ActionCards } from './ActionCards';
import { RecentGames } from './RecentGames';
import { UserStats } from './UserStats';

export function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="u-flex u-flex--center u-min-h-screen">
        <div className="user-stats__spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="dashboard">
      <div className="dashboard__welcome">
        <h1 className="dashboard__title">
          Bienvenue, {user.prenom}!
        </h1>
        <p className="dashboard__subtitle">
          Prêt à deviner des joueurs de football ?
        </p>
      </div>

      <ActionCards />

      <div className="dashboard__grid">
        <RecentGames />
        <UserStats />
      </div>
    </main>
  );
}

