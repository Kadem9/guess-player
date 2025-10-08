'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaGamepad } from 'react-icons/fa';
import Link from 'next/link';
import { gameApi } from '@/lib/api';

export default function CreateGamePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleCreateGame = async () => {
    setCreating(true);
    setError('');

    try {
      const data = await gameApi.create();
      router.push(`/game/${data.game.id}`);
    } catch (error: any) {
      setError(error.message);
      setCreating(false);
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
              <FaGamepad /> Créer une nouvelle partie
            </h2>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Comment ça marche ?</h3>
                <ul className="list-disc list-inside space-y-2 text-base-content/80">
                  <li>Un code unique sera généré pour votre partie</li>
                  <li>Partagez ce code avec vos amis</li>
                  <li>Minimum 2 joueurs pour commencer</li>
                  <li>Maximum 6 joueurs par partie</li>
                  <li>Tour par tour : devinez les joueurs de foot !</li>
                </ul>
              </div>

              <div className="card bg-primary text-primary-content">
                <div className="card-body">
                  <h3 className="card-title">Vous serez l'hôte</h3>
                  <p>En tant qu'hôte, vous pourrez lancer la partie quand tous les joueurs seront prêts.</p>
                </div>
              </div>

              <div className="card-actions justify-end pt-4">
                <button
                  onClick={handleCreateGame}
                  className={`btn btn-primary btn-lg ${creating ? 'loading' : ''}`}
                  disabled={creating}
                >
                  {creating ? 'Création...' : 'Créer la partie'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
