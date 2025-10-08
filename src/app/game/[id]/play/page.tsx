'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaCheck, FaTimes, FaClock, FaTrophy } from 'react-icons/fa';
import Link from 'next/link';
import playersData from '@/data/players.json';

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

interface Player {
  id: string;
  nom: string;
  equipe: string;
  position: string;
  nationalite: string;
  image: string;
  indice: string;
}

export default function PlayGamePage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchGame();
    }
  }, [user, params.id]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games/${params.id}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setGame(data.game);
      
      // Générer un joueur aléatoire pour cette partie
      if (data.game.status === 'IN_PROGRESS') {
        const randomPlayer = playersData[Math.floor(Math.random() * playersData.length)];
        setCurrentPlayer(randomPlayer as Player);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !currentPlayer) return;

    setSubmitting(true);
    
    // Simulation de vérification (pour l'instant)
    const isGuessCorrect = guess.toLowerCase().trim() === currentPlayer.nom.toLowerCase();
    setIsCorrect(isGuessCorrect);
    setShowResult(true);

    // TODO: Envoyer à l'API pour enregistrer le score
    
    setSubmitting(false);
  };

  const handleNextPlayer = () => {
    // Générer un nouveau joueur
    const randomPlayer = playersData[Math.floor(Math.random() * playersData.length)];
    setCurrentPlayer(randomPlayer as Player);
    setGuess('');
    setShowResult(false);
    setIsCorrect(false);
  };

  const getCurrentPlayerTurn = () => {
    if (!game) return null;
    const currentIndex = game.currentTurn % game.players.length;
    return game.players[currentIndex];
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

  if (game.status !== 'IN_PROGRESS') {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href={`/game/${game.id}`} className="btn btn-ghost mb-6">
            <FaArrowLeft /> Retour à la partie
          </Link>
          <div className="alert alert-warning">
            <span>Cette partie n'est pas encore commencée</span>
          </div>
        </div>
      </div>
    );
  }

  const currentTurnPlayer = getCurrentPlayerTurn();
  const isMyTurn = currentTurnPlayer?.userId === user.id;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/game/${game.id}`} className="btn btn-ghost">
            <FaArrowLeft /> Retour à la partie
          </Link>
          <div className="badge badge-info badge-lg">
            Tour {game.currentTurn}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Zone de jeu principale */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {/* Tour actuel */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {isMyTurn ? 'Votre tour !' : 'Tour de ' + currentTurnPlayer?.user.prenom}
                  </h2>
                  <div className="badge badge-primary badge-lg">
                    {currentTurnPlayer?.user.prenom} {currentTurnPlayer?.user.nom}
                  </div>
                </div>

                {/* Joueur à deviner */}
                {currentPlayer && (
                  <div className="space-y-6">
                    <div className="bg-base-200 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Indice :</h3>
                      <p className="text-base-content/80 text-lg">
                        {currentPlayer.indice}
                      </p>
                    </div>

                    {/* Formulaire de devinette */}
                    {isMyTurn && !showResult && (
                      <form onSubmit={handleSubmitGuess} className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">Votre réponse :</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Nom du joueur..."
                            className="input input-bordered input-lg"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            disabled={submitting}
                            autoFocus
                          />
                        </div>
                        <button
                          type="submit"
                          className={`btn btn-primary btn-lg w-full ${submitting ? 'loading' : ''}`}
                          disabled={!guess.trim() || submitting}
                        >
                          {submitting ? 'Vérification...' : 'Deviner !'}
                        </button>
                      </form>
                    )}

                    {/* Résultat */}
                    {showResult && (
                      <div className="space-y-4">
                        <div className={`alert ${isCorrect ? 'alert-success' : 'alert-error'}`}>
                          <div className="flex items-center gap-2">
                            {isCorrect ? <FaCheck /> : <FaTimes />}
                            <span className="font-semibold">
                              {isCorrect ? 'Correct !' : 'Incorrect !'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-base-200 p-6 rounded-lg">
                          <h4 className="font-semibold mb-2">Le joueur était :</h4>
                          <div className="text-xl font-bold text-primary">
                            {currentPlayer.nom}
                          </div>
                          <div className="text-sm text-base-content/70 mt-1">
                            {currentPlayer.position} • {currentPlayer.equipe} • {currentPlayer.nationalite}
                          </div>
                        </div>

                        {isMyTurn && (
                          <button
                            onClick={handleNextPlayer}
                            className="btn btn-secondary btn-lg w-full"
                          >
                            Joueur suivant
                          </button>
                        )}
                      </div>
                    )}

                    {/* Attente du tour */}
                    {!isMyTurn && !showResult && (
                      <div className="alert alert-info">
                        <FaClock />
                        <span>Attendez votre tour...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panneau latéral */}
          <div>
            {/* Scores */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title mb-4">
                  <FaTrophy /> Scores
                </h3>
                <div className="space-y-2">
                  {game.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          player.userId === user.id ? 'bg-primary/20' : 'bg-base-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="badge badge-primary">{index + 1}</div>
                          <span className="text-sm font-semibold">
                            {player.user.prenom}
                          </span>
                        </div>
                        <div className="badge badge-outline">
                          {player.score}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Règles */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">Règles</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Chaque joueur a 30 secondes</li>
                  <li>1 point par bonne réponse</li>
                  <li>Tour par tour</li>
                  <li>Le plus de points gagne !</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
