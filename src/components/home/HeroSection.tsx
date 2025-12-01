'use client';

import { Trophy, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const router = useRouter();

  return (
    <main className="hero">
      <div className="hero__background">
        <div className="hero__blob hero__blob--blue"></div>
        <div className="hero__blob hero__blob--purple"></div>
      </div>

      <div className="hero__content">
        <div className="hero__title-section">
          <h1 className="hero__title">
            Guess Player
          </h1>
          <div className="hero__title-underline"></div>
        </div>

        <p className="hero__subtitle">
          Devinez les joueurs de football en mode tour par tour avec vos amis !
        </p>

        <div className="hero__cta">
          <button
            onClick={() => router.push('/dashboard')}
            className="hero__button hero__button--primary"
          >
            <BarChart3 className="hero__button-icon" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="hero__button hero__button--secondary"
          >
            <Trophy className="hero__button-icon" />
            <span>Classement</span>
          </button>
        </div>
      </div>
    </main>
  );
}

