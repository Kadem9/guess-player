'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaGamepad, FaUsers, FaClock, FaTrophy, FaCog } from 'react-icons/fa';
import Link from 'next/link';
import { gameApi } from '@/lib/api';
import { GameSettings, Difficulty } from '@/types';

export default function CreateGamePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState<GameSettings>({
    maxPlayers: 4,
    maxTurns: 10,
    difficulty: 'MEDIUM',
    timePerTurn: 30
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleCreateGame = async () => {
    setCreating(true);
    setError('');

    try {
      const data = await gameApi.create(settings);
      router.push(`/game/${data.game.id}`);
    } catch (error: any) {
      setError(error.message);
      setCreating(false);
    }
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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

            <div className="space-y-6">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">
                    <FaCog /> Configuration de la partie
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          <FaUsers className="inline mr-2" />
                          Nombre maximum de joueurs
                        </span>
                      </label>
                      <select 
                        className="select select-bordered"
                        value={settings.maxPlayers}
                        onChange={(e) => updateSetting('maxPlayers', parseInt(e.target.value))}
                      >
                        <option value={2}>2 joueurs</option>
                        <option value={3}>3 joueurs</option>
                        <option value={4}>4 joueurs</option>
                        <option value={5}>5 joueurs</option>
                        <option value={6}>6 joueurs</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          <FaTrophy className="inline mr-2" />
                          Nombre de tours
                        </span>
                      </label>
                      <select 
                        className="select select-bordered"
                        value={settings.maxTurns}
                        onChange={(e) => updateSetting('maxTurns', parseInt(e.target.value))}
                      >
                        <option value={5}>5 tours</option>
                        <option value={10}>10 tours</option>
                        <option value={15}>15 tours</option>
                        <option value={20}>20 tours</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Niveau de difficulté</span>
                      </label>
                      <select 
                        className="select select-bordered"
                        value={settings.difficulty}
                        onChange={(e) => updateSetting('difficulty', e.target.value as Difficulty)}
                      >
                        <option value="EASY">Facile - Joueurs très connus</option>
                        <option value="MEDIUM">Moyen - Mix de joueurs</option>
                        <option value="HARD">Difficile - Joueurs moins connus</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          <FaClock className="inline mr-2" />
                          Temps par réponse (secondes)
                        </span>
                      </label>
                      <select 
                        className="select select-bordered"
                        value={settings.timePerTurn}
                        onChange={(e) => updateSetting('timePerTurn', parseInt(e.target.value))}
                      >
                        <option value={15}>15 secondes</option>
                        <option value={20}>20 secondes</option>
                        <option value={30}>30 secondes</option>
                        <option value={45}>45 secondes</option>
                        <option value={60}>1 minute</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Résumé de votre partie</h3>
                <ul className="list-disc list-inside space-y-2 text-base-content/80">
                  <li><strong>Joueurs :</strong> Maximum {settings.maxPlayers} joueurs</li>
                  <li><strong>Tours :</strong> {settings.maxTurns} tours au total</li>
                  <li><strong>Difficulté :</strong> {settings.difficulty === 'EASY' ? 'Facile' : settings.difficulty === 'MEDIUM' ? 'Moyen' : 'Difficile'}</li>
                  <li><strong>Temps :</strong> {settings.timePerTurn} secondes par réponse</li>
                  <li>Un code unique sera généré pour votre partie</li>
                  <li>Partagez ce code avec vos amis pour qu'ils rejoignent</li>
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
