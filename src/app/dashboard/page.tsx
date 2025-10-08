'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaPlus, FaUsers, FaTrophy, FaGamepad } from 'react-icons/fa';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenue, {user.prenom} !
          </h1>
          <p className="text-base-content/70">
            Prêt à deviner des joueurs de football ?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card bg-primary text-primary-content shadow-xl hover:scale-105 transition-transform">
            <div className="card-body">
              <FaPlus className="text-3xl mb-2" />
              <h2 className="card-title">Créer une partie</h2>
              <p>Lancez une nouvelle partie et invitez vos amis</p>
              <div className="card-actions justify-end mt-4">
                <Link href="/game/create" className="btn btn-secondary">
                  Créer
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-secondary text-secondary-content shadow-xl hover:scale-105 transition-transform">
            <div className="card-body">
              <FaUsers className="text-3xl mb-2" />
              <h2 className="card-title">Rejoindre une partie</h2>
              <p>Entrez le code d'une partie existante</p>
              <div className="card-actions justify-end mt-4">
                <Link href="/game/join" className="btn btn-primary">
                  Rejoindre
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-accent text-accent-content shadow-xl hover:scale-105 transition-transform">
            <div className="card-body">
              <FaTrophy className="text-3xl mb-2" />
              <h2 className="card-title">Classement</h2>
              <p>Consultez les meilleurs joueurs</p>
              <div className="card-actions justify-end mt-4">
                <Link href="/leaderboard" className="btn btn-neutral">
                  Voir
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FaGamepad /> Parties récentes
              </h2>
              <div className="divider"></div>
              <div className="text-center py-8 text-base-content/50">
                Aucune partie récente
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FaTrophy /> Vos statistiques
              </h2>
              <div className="divider"></div>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Parties jouées</div>
                  <div className="stat-value">0</div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">Victoires</div>
                  <div className="stat-value text-success">0</div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">Score total</div>
                  <div className="stat-value text-primary">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
