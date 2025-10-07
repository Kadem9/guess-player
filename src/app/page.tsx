'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="hero min-h-[calc(100vh-200px)]">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-6xl font-bold mb-4 text-base-content">
            Guess Player
          </h1>
          <p className="text-xl mb-8 text-base-content/80">
            Devinez les joueurs de football en mode tour par tour avec vos amis !
          </p>
          
          {user ? (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Dashboard
              </Link>
              <Link href="/leaderboard" className="btn btn-secondary btn-lg">
                Classement
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login" className="btn btn-primary btn-lg">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-secondary btn-lg">
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

