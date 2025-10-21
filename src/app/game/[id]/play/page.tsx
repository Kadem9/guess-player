'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { FaArrowLeft, FaCheck, FaTimes, FaClock, FaTrophy } from 'react-icons/fa';
import Link from 'next/link';
import { getRandomPlayer } from '@/utils/gameUtils';
import { useTimerSound } from '@/hooks/useTimerSound';

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
  const [timeLeft, setTimeLeft] = useState(30);
  const { playWarning } = useTimerSound();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (game?.timePerTurn && typeof game.timePerTurn === 'number') {
      setTimeLeft(game.timePerTurn);
    }
  }, [game?.timePerTurn]);

  const fetchGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${params.id}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      const tourAChange = game && data.game.currentTurn !== game.currentTurn;
      
      setGame(data.game);
      
      if (tourAChange) {
        const difficulty = data.game.difficulty || 'MEDIUM';
        const randomPlayer = getRandomPlayer(difficulty);
        setCurrentPlayer(randomPlayer);
        setGuess('');
        setShowResult(false);
        setIsCorrect(false);
        setTimeLeft(data.game.timePerTurn || 30);
      }
      
      if (!currentPlayer && data.game.status === 'IN_PROGRESS') {
        const difficulty = data.game.difficulty || 'MEDIUM';
        const randomPlayer = getRandomPlayer(difficulty);
        setCurrentPlayer(randomPlayer);
        setTimeLeft(data.game.timePerTurn || 30);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [params.id, game, currentPlayer]);

  const getCurrentPlayerTurn = useCallback(() => {
    if (!game) return null;
    const currentIndex = game.currentTurn % game.players.length;
    return game.players[currentIndex];
  }, [game]);

  const handleNextPlayer = useCallback(async () => {
    if (!game || !user) return;
    
    const nextTurn = game.currentTurn + 1;
    
    try {
      await fetch(`/api/games/${params.id}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turn: nextTurn }),
        credentials: 'include',
      });
      
      await fetchGame();
    } catch (error) {
      console.error('Erreur changement de tour:', error);
    }
  }, [game, user, params.id, fetchGame]);

  useEffect(() => {
    if (user && params.id) {
      fetchGame();
      const interval = setInterval(fetchGame, 4000);
      return () => clearInterval(interval);
    }
  }, [user, params.id, fetchGame]);

  useEffect(() => {
    if (!game || game.status !== 'IN_PROGRESS' || showResult || !user) {
      return;
    }

    const currentIndex = game.currentTurn % game.players.length;
    const currentTurnPlayer = game.players[currentIndex];
    const isMyTurn = currentTurnPlayer?.userId === user.id;

    if (!isMyTurn) {
      return;
    }

    if (timeLeft <= 0) {
      setShowResult(true);
      setIsCorrect(false);
      setTimeout(() => {
        handleNextPlayer();
      }, 2000);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        return isNaN(newTime) ? (game?.timePerTurn || 30) : newTime;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [timeLeft, game?.currentTurn, game?.status, showResult, user?.id]);

  // on met le son d'alerte a 10 secondes
  useEffect(() => {
    if (timeLeft === 10 && !showResult) {
      playWarning();
    }
  }, [timeLeft, showResult, playWarning]);

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !currentPlayer || !game || !user) return;

    setSubmitting(true);
    
    const correct = guess.toLowerCase().trim() === currentPlayer.nom.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      try {
        await fetch(`/api/games/${params.id}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: user.id, isCorrect: true }),
          credentials: 'include',
        });
      } catch (error) {
        console.error('Erreur mise à jour score:', error);
      }
    }
    
    setSubmitting(false);
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
            <FaArrowLeft /> Retour
          </Link>
          <div className="badge badge-info badge-lg">
            Tour {game.currentTurn + 1}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {isMyTurn ? 'Votre tour !' : `Tour de ${currentTurnPlayer?.user.prenom}`}
                  </h2>
                  <div className="badge badge-primary badge-lg">
                    {currentTurnPlayer?.user.prenom} {currentTurnPlayer?.user.nom}
                  </div>
                  
                  {isMyTurn && !showResult && (
                    <div className="mt-4">
                      <div className={`text-4xl font-bold ${timeLeft <= 10 ? 'text-error' : 'text-primary'}`}>
                        <FaClock className="inline mr-2" />
                        {isNaN(timeLeft) ? '--' : `${timeLeft}s`}
                      </div>
                      <progress 
                        className="progress progress-primary w-full mt-2" 
                        value={isNaN(timeLeft) ? 0 : timeLeft} 
                        max={game?.timePerTurn || 30}
                      ></progress>
                    </div>
                  )}
                </div>

                {currentPlayer ? (
                  <div className="space-y-6">
                    <div className="bg-base-200 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Indice :</h3>
                      <p className="text-base-content/80 text-lg">
                        {currentPlayer.indice}
                      </p>
                      <div className="mt-4 text-sm text-base-content/60">
                        <p><strong>Position:</strong> {currentPlayer.position}</p>
                        <p><strong>Équipe:</strong> {currentPlayer.equipe}</p>
                        <p><strong>Nationalité:</strong> {currentPlayer.nationalite}</p>
                      </div>
                    </div>

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

                    {showResult && (
                      <div className="space-y-4">
                        <div className={`alert ${isCorrect ? 'alert-success' : 'alert-error'}`}>
                          <div className="flex items-center gap-2">
                            {isCorrect ? <FaCheck /> : <FaTimes />}
                            <span className="font-semibold">
                              {isCorrect ? 'Correct ! +1 point' : timeLeft === 0 ? 'Temps écoulé !' : 'Incorrect !'}
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
                            disabled={submitting}
                          >
                            Joueur suivant
                          </button>
                        )}
                      </div>
                    )}

                    {!isMyTurn && !showResult && (
                      <div className="alert alert-info">
                        <FaClock />
                        <span>Attendez votre tour...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <span>Chargement du joueur à deviner...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
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
                            {player.userId === currentTurnPlayer?.userId && ' 🎯'}
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

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">Règles</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>30 secondes par tour</li>
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