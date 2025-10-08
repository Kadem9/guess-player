'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { FaArrowLeft, FaUsers, FaPlay, FaClock, FaTrophy } from 'react-icons/fa';
import Link from 'next/link';

interface GamePlayer {
  id: string;
  userId: string;
  isHost: boolean;
  score: number;
  joinedAt: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    username: string;
  };
}

interface Game {
  id: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  currentTurn: number;
  maxPlayers: number;
  createdAt: string;
  creator: {
    id: string;
    nom: string;
    prenom: string;
    username: string;
  };
  players: GamePlayer[];
}

export default function GamePage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${params.id}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setGame(data.game);
      setIsHost(data.isHost);
      
      if (data.game.status === 'IN_PROGRESS') {
        router.push(`/game/${params.id}/play`);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchGame();
      const interval = setInterval(fetchGame, 3000);
      return () => clearInterval(interval);
    }
  }, [user, params.id, fetchGame]);

  const handleStartGame = async () => {
    setStarting(true);
    try {
      const response = await fetch(`/api/games/${params.id}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du démarrage');
      }

      // Rediriger vers l'écran de jeu
      router.push(`/game/${params.id}/play`);
    } catch (error: any) {
      setError(error.message);
      setStarting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WAITING': return 'En attente';
      case 'IN_PROGRESS': return 'En cours';
      case 'FINISHED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'badge-warning';
      case 'IN_PROGRESS': return 'badge-info';
      case 'FINISHED': return 'badge-success';
      case 'CANCELLED': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/dashboard" className="btn btn-ghost mb-6">
            <FaArrowLeft /> Retour au Dashboard
          </Link>
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/dashboard" className="btn btn-ghost mb-6">
            <FaArrowLeft /> Retour au Dashboard
          </Link>
          <div className="alert alert-warning">
            <span>Partie non trouvée</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/dashboard" className="btn btn-ghost mb-6">
          <FaArrowLeft /> Retour au Dashboard
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informations de la partie */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title text-2xl">Partie #{game.id.slice(0, 8)}</h2>
                  <div className={`badge ${getStatusColor(game.status)}`}>
                    {getStatusText(game.status)}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-figure text-primary">
                        <FaUsers className="text-2xl" />
                      </div>
                      <div className="stat-title">Joueurs</div>
                      <div className="stat-value">{game.players.length}/{game.maxPlayers}</div>
                    </div>
                  </div>

                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-figure text-secondary">
                        <FaClock className="text-2xl" />
                      </div>
                      <div className="stat-title">Créée le</div>
                      <div className="stat-value text-sm">
                        {new Date(game.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des joueurs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Joueurs connectés</h3>
                  <div className="space-y-2">
                    {game.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-10">
                              <span className="text-sm">
                                {player.user.prenom[0]}{player.user.nom[0]}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">
                              {player.user.prenom} {player.user.nom}
                            </div>
                            <div className="text-sm text-base-content/70">
                              @{player.user.username}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {player.isHost && (
                            <div className="badge badge-primary">Hôte</div>
                          )}
                          <div className="badge badge-outline">
                            <FaTrophy className="mr-1" /> {player.score}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions selon le statut */}
                {game.status === 'WAITING' && (
                  <div className="card-actions justify-end pt-4">
                    {isHost ? (
                      <button
                        onClick={handleStartGame}
                        className={`btn btn-primary btn-lg ${starting ? 'loading' : ''}`}
                        disabled={starting || game.players.length < 2}
                      >
                        <FaPlay className="mr-2" />
                        {starting ? 'Démarrage...' : 'Lancer la partie'}
                      </button>
                    ) : (
                      <div className="alert alert-info">
                        <FaClock />
                        <span>En attente que l'hôte lance la partie...</span>
                      </div>
                    )}
                  </div>
                )}

                {game.status === 'IN_PROGRESS' && (
                  <div className="card-actions justify-end pt-4">
                    <Link href={`/game/${game.id}/play`} className="btn btn-primary btn-lg">
                      <FaPlay className="mr-2" />
                      Continuer la partie
                    </Link>
                  </div>
                )}

                {game.status === 'FINISHED' && (
                  <div className="card-actions justify-end pt-4">
                    <Link href={`/game/${game.id}/results`} className="btn btn-secondary btn-lg">
                      <FaTrophy className="mr-2" />
                      Voir les résultats
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code de la partie */}
          <div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">Code de la partie</h3>
                <div className="bg-base-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {game.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="text-sm text-base-content/70 mt-2">
                    Partagez ce code avec vos amis
                  </div>
                </div>
                <button
                  className="btn btn-outline btn-sm mt-4"
                  onClick={() => navigator.clipboard.writeText(game.id)}
                >
                  Copier le code
                </button>
              </div>
            </div>

            {/* Règles du jeu */}
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h3 className="card-title mb-4">Règles</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Minimum 2 joueurs pour commencer</li>
                  <li>Maximum 6 joueurs par partie</li>
                  <li>Tour par tour : devinez les joueurs</li>
                  <li>Chaque bonne réponse = 1 point</li>
                  <li>Le joueur avec le plus de points gagne !</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
