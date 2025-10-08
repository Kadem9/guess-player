'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaUsers } from 'react-icons/fa';
import Link from 'next/link';
import { gameApi } from '@/lib/api';

export default function JoinGamePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError('');

    try {
      const data = await gameApi.join(gameCode.trim());
      router.push(`/game/${gameCode.trim()}`);
    } catch (error: any) {
      setError(error.message);
      setJoining(false);
    }
  };

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
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/dashboard" className="btn btn-ghost mb-6">
          <FaArrowLeft /> Retour au Dashboard
        </Link>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl mb-4">
              <FaUsers /> Rejoindre une partie
            </h2>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoinGame} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-lg">Code de la partie</span>
                </label>
                <input
                  type="text"
                  placeholder="Entrez le code (ex: clxyz123)"
                  className="input input-bordered input-lg text-center font-mono text-xl"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  disabled={joining}
                  maxLength={20}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Demandez le code à l'hôte de la partie</span>
                </label>
              </div>

              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Informations</h3>
                <ul className="list-disc list-inside space-y-2 text-base-content/80">
                  <li>Vous rejoindrez la partie en tant que joueur</li>
                  <li>Attendez que l'hôte lance la partie</li>
                  <li>Devinez un maximum de joueurs pour gagner !</li>
                </ul>
              </div>

              <div className="card-actions justify-end">
                <button
                  type="submit"
                  className={`btn btn-primary btn-lg ${joining ? 'loading' : ''}`}
                  disabled={joining || !gameCode.trim()}
                >
                  {joining ? 'Connexion...' : 'Rejoindre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
