'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Clock, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { useTimerSound } from '@/hooks/useTimerSound';
import { checkAnswer } from '@/utils/gameUtils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Player } from '@/types';

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
  maxTurns: number;
  timePerTurn: number;
  difficulty?: string;
  createdAt: string;
  creator: {
    id: string;
    nom: string;
    prenom: string;
    username: string;
  };
  players: GamePlayer[];
}

interface GamePlayProps {
  gameId: string;
}

export function GamePlay({ gameId }: GamePlayProps) {
  const { user, isLoading } = useAuth();
  const { socket, isConnected, joinGame, leaveGame, emitAnswerSubmitted, emitTurnChanged, emitPlayerForfeit } = useSocketContext();
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
  const [playerPhoto, setPlayerPhoto] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const { playWarning } = useTimerSound();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!game || game.status !== 'IN_PROGRESS' || !user) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const playerInGame = game.players.find(p => p.userId === user.id);
      if (playerInGame) {
        e.preventDefault();
        e.returnValue = 'En quittant la partie, vous déclarez forfait. Êtes-vous sûr ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [game, user]);

  const handleForfeit = () => {
    if (!game || !user) return;
    setShowForfeitModal(true);
  };

  const confirmForfeit = async () => {
    if (!game || !user) return;

    setShowForfeitModal(false);

    try {
      const response = await fetch(`/api/games/${gameId}/forfeit`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'abandon');
      }

      // Émettre l'événement Socket.io pour forfait
      const playerInGame = game.players.find(p => p.userId === user.id);
      if (playerInGame) {
        emitPlayerForfeit(gameId, playerInGame.id);
      }

      // Rediriger vers les résultats
      router.push(`/game/${gameId}/results`);
    } catch (error: any) {
      console.error('Erreur abandon:', error);
      alert(error.message || 'Erreur lors de l\'abandon de la partie');
    }
  };

  useEffect(() => {
    if (game?.timePerTurn && typeof game.timePerTurn === 'number') {
      setTimeLeft(game.timePerTurn);
    }
  }, [game?.timePerTurn]);

  const fetchGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      if (data.game.status === 'FINISHED') {
        router.push(`/game/${gameId}/results`);
        return;
      }

      const tourAChange = game && data.game.currentTurn !== game.currentTurn;
      
      setGame(data.game);
      
      if (tourAChange || (!currentPlayer && data.game.status === 'IN_PROGRESS')) {
        try {
          const questionResponse = await fetch(`/api/games/${gameId}/question`, {
            method: 'POST',
            credentials: 'include',
          });

          const questionData = await questionResponse.json();

          if (!questionResponse.ok) {
            throw new Error(questionData.error || 'Erreur lors de la récupération de la question');
          }

          if (questionData.gameFinished) {
            router.push(`/game/${gameId}/results`);
            return;
          }

          setCurrentPlayer(questionData.player);
          setGuess('');
          setShowResult(false);
          setIsCorrect(false);
          setSubmitting(false);
          setTimeLeft(data.game.timePerTurn || 30);
          setPlayerPhoto(null);
        } catch (error: any) {
          console.error('Erreur récupération question:', error);
          setError(error.message);
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [gameId, game, currentPlayer, router]);

  const getCurrentPlayerTurn = useCallback(() => {
    if (!game) return null;
    const currentIndex = game.currentTurn % game.players.length;
    return game.players[currentIndex];
  }, [game]);

  const fetchPlayerPhoto = useCallback(async (playerName: string) => {
    setLoadingPhoto(true);
    try {
      const response = await fetch(`/api/players/${encodeURIComponent(playerName)}/photo`);
      const data = await response.json();
      
      if (data.success && data.photo) {
        setPlayerPhoto(data.photo);
      } else {
        setPlayerPhoto(null);
      }
    } catch (error) {
      console.error('Erreur récupération photo:', error);
      setPlayerPhoto(null);
    } finally {
      setLoadingPhoto(false);
    }
  }, []);

  const handleNextPlayer = useCallback(async () => {
    if (!game || !user) return;
    
    const nextTurn = game.currentTurn + 1;
    
    if (nextTurn >= game.maxTurns) {
      try {
        await fetch(`/api/games/${gameId}/finish`, {
          method: 'POST',
          credentials: 'include',
        });
        router.push(`/game/${gameId}/results`);
        return;
      } catch (error) {
        console.error('Erreur fin de partie:', error);
      }
    }
    
    setShowResult(false);
    setIsCorrect(false);
    setGuess('');
    
    try {
      await fetch(`/api/games/${gameId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turn: nextTurn }),
        credentials: 'include',
      });

      // Émettre l'événement Socket.io pour changement de tour
      emitTurnChanged(gameId, nextTurn);
      
      await fetchGame();
    } catch (error) {
      console.error('Erreur changement de tour:', error);
    }
  }, [game, user, gameId, fetchGame, router, emitTurnChanged]);

  // Chargement initial
  useEffect(() => {
    if (user && gameId) {
      fetchGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gameId]);

  // Extraire l'ID complet de la partie de manière stable
  const fullGameId = useMemo(() => game?.id, [game?.id]);

  // Rejoindre la room Socket.io avec l'ID complet de la partie
  useEffect(() => {
    if (isConnected && fullGameId) {
      joinGame(fullGameId);

      return () => {
        leaveGame(fullGameId);
      };
    }
  }, [isConnected, fullGameId, joinGame, leaveGame]);

  // Écouter les événements Socket.io
  useEffect(() => {
    if (!socket || !game) return;

    const handleGameUpdated = ({ gameId: updatedGameId }: { gameId: string }) => {
      if (updatedGameId.toLowerCase() === game.id.toLowerCase()) {
        // Recharger les données de la partie
        fetch(`/api/games/${gameId}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.game) {
              if (data.game.status === 'FINISHED') {
                router.push(`/game/${gameId}/results`);
                return;
              }
              setGame(data.game);
            }
          })
          .catch(err => console.error('Erreur rechargement partie:', err));
      }
    };

    const handleTurnUpdated = ({ gameId: updatedGameId }: { gameId: string }) => {
      if (updatedGameId.toLowerCase() === game.id.toLowerCase()) {
        // Recharger pour le nouveau tour
        fetch(`/api/games/${gameId}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.game) {
              setGame(data.game);
            }
          })
          .catch(err => console.error('Erreur rechargement partie:', err));
      }
    };

    const handleGameFinished = ({ gameId: finishedGameId }: { gameId: string }) => {
      if (finishedGameId.toLowerCase() === game.id.toLowerCase()) {
        router.push(`/game/${game.id}/results`);
      }
    };

    socket.on('game-updated', handleGameUpdated);
    socket.on('turn-updated', handleTurnUpdated);
    socket.on('game-finished', handleGameFinished);

    return () => {
      socket.off('game-updated', handleGameUpdated);
      socket.off('turn-updated', handleTurnUpdated);
      socket.off('game-finished', handleGameFinished);
    };
  }, [socket, game?.id, gameId, router]);

  // Reset du chrono
  useEffect(() => {
    if (game && game.status === 'IN_PROGRESS' && !showResult) {
      const currentIndex = game.currentTurn % game.players.length;
      const currentTurnPlayer = game.players[currentIndex];
      const isMyTurn = currentTurnPlayer?.userId === user?.id;
      
      if (isMyTurn) {
        const initialTime = game.timePerTurn || 30;
        setTimeLeft(initialTime);
      }
    }
  }, [game?.currentTurn, showResult, game?.status, user?.id]);

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
      // On récup la photo du joueur quand le tps est écoulé
      if (currentPlayer?.nom) {
        fetchPlayerPhoto(currentPlayer.nom);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [timeLeft, game?.status, game?.currentTurn, showResult, user?.id]);

  // Son d'alerte à 10 secondes
  useEffect(() => {
    if (timeLeft === 10 && !showResult) {
      playWarning();
    }
  }, [timeLeft, showResult, playWarning]);

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !currentPlayer || !game || !user) return;

    setSubmitting(true);
    
    const correct = checkAnswer(guess, currentPlayer);
    setIsCorrect(correct);
    setShowResult(true);

    // Récupérer la photo du joueur seulement après la réponse
    if (currentPlayer?.nom) {
      fetchPlayerPhoto(currentPlayer.nom);
    }

    if (correct) {
      try {
        await fetch(`/api/games/${gameId}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: user.id, isCorrect: true }),
          credentials: 'include',
        });

        // Émettre l'événement Socket.io
        const playerInGame = game.players.find(p => p.userId === user.id);
        if (playerInGame) {
          emitAnswerSubmitted(gameId, playerInGame.id, true);
        }
      } catch (error) {
        console.error('Erreur mise à jour score:', error);
      }
    } else {
      // Émettre également pour les mauvaises réponses
      const playerInGame = game.players.find(p => p.userId === user.id);
      if (playerInGame) {
        emitAnswerSubmitted(gameId, playerInGame.id, false);
      }
    }
    
    setSubmitting(false);
  };

  if (isLoading || loading) {
    return (
      <div className="u-flex u-flex--center u-min-h-screen">
        <div className="user-stats__spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <main className="game-play">
        <button
          onClick={() => router.push('/dashboard')}
          className="game-play__back"
        >
          <ArrowLeft className="game-play__back-icon" />
          Retour au Dashboard
        </button>
        <div className="game-play__card">
          <div className="create-game__error">{error}</div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="game-play">
        <button
          onClick={() => router.push('/dashboard')}
          className="game-play__back"
        >
          <ArrowLeft className="game-play__back-icon" />
          Retour au Dashboard
        </button>
        <div className="game-play__card">
          <p className="create-game__error">Partie non trouvée</p>
        </div>
      </main>
    );
  }

  if (game.status !== 'IN_PROGRESS') {
    return (
      <main className="game-play">
        <button
          onClick={() => router.push(`/game/${game.id}`)}
          className="game-play__back"
        >
          <ArrowLeft className="game-play__back-icon" />
          Retour à la partie
        </button>
        <div className="game-play__card">
          <p className="create-game__error">Cette partie n&apos;est pas encore commencée</p>
        </div>
      </main>
    );
  }

  const currentTurnPlayer = getCurrentPlayerTurn();
  const isMyTurn = currentTurnPlayer?.userId === user.id;
  const progress = game.timePerTurn ? (timeLeft / game.timePerTurn) * 100 : 0;

  return (
    <main className="game-play">
      <div className="game-play__header">
        <button
          onClick={handleForfeit}
          className="game-play__back"
        >
          <ArrowLeft className="game-play__back-icon" />
          Quitter la partie
        </button>

        <div className="game-play__turn-badge">
          Tour {game.currentTurn + 1}
        </div>
      </div>

      <div className="game-play__grid">
        <div className="game-play__main">
          <div className="game-play__card">
            <div className="game-play__turn-section">
              <h2 className="game-play__turn-title">
                {isMyTurn ? 'Votre tour !' : `Tour de ${currentTurnPlayer?.user.prenom}`}
              </h2>
              <div className="game-play__turn-player">
                {currentTurnPlayer?.user.prenom} {currentTurnPlayer?.user.nom}
              </div>
            </div>

            {isMyTurn && !showResult && (
              <div className="game-play__timer">
                <div className="game-play__timer-display">
                  <div className={`game-play__timer-value ${timeLeft <= 10 ? 'game-play__timer-value--warning' : ''}`}>
                    {isNaN(timeLeft) ? '--' : `${timeLeft}s`}
                  </div>
                </div>
                <div className="game-play__timer-progress">
                  <div
                    className="game-play__timer-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {currentPlayer ? (
              <div className="u-flex u-flex--column" style={{ gap: '1.5rem' }}>
                <div className="game-play__clue">
                  <h3 className="game-play__clue-title">
                    Indice :
                  </h3>
                  <p className="game-play__clue-text">
                    {currentPlayer.indice}
                  </p>
                  <div className="game-play__clue-details">
                    <p>{currentPlayer.position}</p>
                    <p>{currentPlayer.equipe}</p>
                    <p>{currentPlayer.nationalite}</p>
                  </div>
                </div>

                {isMyTurn && !showResult && (
                  <form onSubmit={handleSubmitGuess} className="game-play__form">
                    <div className="game-play__field">
                      <label className="game-play__label">
                        Votre réponse :
                      </label>
                      <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Nom du joueur..."
                        className="game-play__input"
                        disabled={submitting}
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!guess.trim() || submitting}
                      className="game-play__submit-button game-play__submit-button--primary"
                    >
                      {submitting ? 'Vérification...' : 'Deviner !'}
                    </button>
                  </form>
                )}

                {showResult && (
                  <div className="game-play__result">
                    <div className={`game-play__result-alert ${isCorrect ? 'game-play__result-alert--success' : 'game-play__result-alert--error'}`}>
                      {isCorrect ? (
                        <>
                          <Check className="game-play__result-alert-icon" />
                          <span>Correct ! +1 point</span>
                        </>
                      ) : (
                        <>
                          <X className="game-play__result-alert-icon" />
                          <span>{timeLeft === 0 ? 'Temps écoulé !' : 'Incorrect !'}</span>
                        </>
                      )}
                    </div>

                    <div className="game-play__result-player">
                      {playerPhoto && (
                        <div className="game-play__result-player-photo-wrapper">
                          <img 
                            src={playerPhoto} 
                            alt={currentPlayer.nom}
                            className="game-play__result-player-photo"
                          />
                        </div>
                      )}
                      <h4 className="game-play__result-player-title">Le joueur était :</h4>
                      <div className="game-play__result-player-name">
                        {currentPlayer.nom}
                      </div>
                      <div className="game-play__result-player-details">
                        {currentPlayer.position} • {currentPlayer.equipe} • {currentPlayer.nationalite}
                      </div>
                    </div>

                    {isMyTurn && (
                      <button
                        onClick={handleNextPlayer}
                        className="game-play__next-button"
                        disabled={submitting}
                      >
                        Joueur suivant
                      </button>
                    )}
                  </div>
                )}

                {!isMyTurn && !showResult && (
                  <div className="game-play__waiting">
                    <Clock className="game-play__waiting-icon" />
                    <span>Attendez votre tour...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="game-play__loading">
                Chargement du joueur à deviner...
              </div>
            )}
          </div>
        </div>

        <div className="game-play__sidebar">
          <div className="game-play__card">
            <h3 className="game-play__scores-title">
              Scores
            </h3>

            <div className="game-play__scores-list">
              {game.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`game-play__score-item ${player.userId === user.id ? 'game-play__score-item--current' : 'game-play__score-item--default'}`}
                  >
                    <div className="game-play__score-left">
                      <div className="game-play__score-rank">
                        {index + 1}
                      </div>
                      <span className="game-play__score-name">
                        {player.user.prenom}
                        {player.userId === currentTurnPlayer?.userId && ' 🎯'}
                      </span>
                    </div>
                    <div className="game-play__score-value">
                      {player.score}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="game-play__card">
            <h3 className="game-play__rules-title">
              Règles
            </h3>

            <ul className="game-play__rules-list">
              <li className="game-play__rules-item">
                <Clock className="game-play__rules-item-icon" />
                <span>{game.timePerTurn || 30} secondes par tour</span>
              </li>
              <li className="game-play__rules-item">
                <span className="game-play__rules-item-bullet">•</span>
                <span>1 point par bonne réponse</span>
              </li>
              <li className="game-play__rules-item">
                <span className="game-play__rules-item-bullet">•</span>
                <span>Tour par tour</span>
              </li>
              <li className="game-play__rules-item">
                <span className="game-play__rules-item-bullet">•</span>
                <span>Le plus de points gagne !</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showForfeitModal}
        title="Déclarer forfait"
        message="En quittant la partie, vous déclarez forfait. La partie sera terminée et la victoire sera donnée à votre adversaire. Êtes-vous sûr de vouloir quitter ?"
        confirmText="Oui, quitter"
        cancelText="Annuler"
        variant="danger"
        onConfirm={confirmForfeit}
        onCancel={() => setShowForfeitModal(false)}
      />
    </main>
  );
}

