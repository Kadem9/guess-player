'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Copy, Users, Calendar, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gameApi } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface GamePlayer {
  id: string;
  userId: string;
  isHost: boolean;
  score: number;
  victories?: number;
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

interface GameLobbyProps {
  gameId: string;
}

export function GameLobby({ gameId }: GameLobbyProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setGame(data.game);
      setIsHost(data.isHost);
      
      if (data.game.status === 'IN_PROGRESS') {
        router.push(`/game/${gameId}/play`);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [gameId, router]);

  useEffect(() => {
    if (user && gameId) {
      fetchGame();
      const interval = setInterval(fetchGame, 3000);
      return () => clearInterval(interval);
    }
  }, [user, gameId, fetchGame]);

  const handleStartGame = async () => {
    setStarting(true);
    try {
      const response = await fetch(`/api/games/${gameId}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du démarrage');
      }

      router.push(`/game/${gameId}/play`);
    } catch (error: any) {
      setError(error.message);
      setStarting(false);
    }
  };

  const handleCopyCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.id.slice(0, 8).toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getPlayerInitials = (prenom: string, nom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
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
      <main className="game-lobby">
        <button
          onClick={() => router.push('/dashboard')}
          className="game-lobby__back"
        >
          <ArrowLeft className="game-lobby__back-icon" />
          Retour au Dashboard
        </button>
        <div className="game-lobby__card">
          <div className="create-game__error">{error}</div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="game-lobby">
        <button
          onClick={() => router.push('/dashboard')}
          className="game-lobby__back"
        >
          <ArrowLeft className="game-lobby__back-icon" />
          Retour au Dashboard
        </button>
        <div className="game-lobby__card">
          <p className="create-game__error">Partie non trouvée</p>
        </div>
      </main>
    );
  }

  const gameCode = game.id.slice(0, 8).toUpperCase();

  const handleLeaveGame = () => {
    if (!game || !user) return;

    // Si la partie est en cours, afficher le modal de confirmation
    if (game.status === 'IN_PROGRESS') {
      setShowForfeitModal(true);
      return;
    }

    // Si la partie est en attente, simplement retourner au dashboard
    router.push('/dashboard');
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

      // Rediriger vers les résultats
      router.push(`/game/${gameId}/results`);
    } catch (error: any) {
      console.error('Erreur abandon:', error);
      alert(error.message || 'Erreur lors de l\'abandon de la partie');
    }
  };

  return (
    <main className="game-lobby">
      <button
        onClick={handleLeaveGame}
        className="game-lobby__back"
      >
        <ArrowLeft className="game-lobby__back-icon" />
        {game?.status === 'IN_PROGRESS' ? 'Quitter la partie' : 'Retour au Dashboard'}
      </button>

      <div className="game-lobby__grid">
        <div className="game-lobby__main">
          <div className="game-lobby__card">
            <div className="game-lobby__header">
              <h2 className="game-lobby__title">
                Partie #{gameCode.toLowerCase()}
              </h2>
              <div className="game-lobby__status">
                En attente
              </div>
            </div>

            <div className="game-lobby__stats">
              <div className="game-lobby__stat">
                <div className="game-lobby__stat-header">
                  <Users className="game-lobby__stat-icon game-lobby__stat-icon--blue" />
                  <span className="game-lobby__stat-label">Joueurs</span>
                </div>
                <p className="game-lobby__stat-value">
                  {game.players.length}/{game.maxPlayers}
                </p>
              </div>

              <div className="game-lobby__stat">
                <div className="game-lobby__stat-header">
                  <Calendar className="game-lobby__stat-icon game-lobby__stat-icon--purple" />
                  <span className="game-lobby__stat-label">Créée le</span>
                </div>
                <p className="game-lobby__stat-value">
                  {formatDate(game.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="game-lobby__card">
            <h3 className="game-lobby__players-title">
              Joueurs connectés
            </h3>

            <div className="game-lobby__players-list">
              {game.players.map((player) => (
                <div key={player.id} className="game-lobby__player">
                  <div className="game-lobby__player-left">
                    <div className="game-lobby__player-avatar">
                      {getPlayerInitials(player.user.prenom, player.user.nom)}
                    </div>
                    <div className="game-lobby__player-info">
                      <p className="game-lobby__player-name">
                        {player.user.prenom} {player.user.nom}
                      </p>
                      <p className="game-lobby__player-username">
                        @{player.user.username}
                      </p>
                    </div>
                  </div>
                  <div className="game-lobby__player-right">
                    {player.isHost && (
                      <span className="game-lobby__badge game-lobby__badge--host">
                        Hôte
                      </span>
                    )}
                    <span className="game-lobby__player-score">
                      {player.victories || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {game.status === 'WAITING' && (
            <div className="game-lobby__start">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={starting || game.players.length < 2}
                  className="game-lobby__start-button game-lobby__start-button--primary"
                >
                  {starting ? 'Démarrage...' : 'Lancer la partie'}
                </button>
              ) : (
                <div className="game-lobby__waiting">
                  <Clock className="game-lobby__waiting-icon" />
                  <span>En attente que l&apos;hôte lance la partie...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="game-lobby__sidebar">
          <div className="game-lobby__card">
            <h3 className="game-lobby__code-title">
              Code de la partie
            </h3>

            <div className="game-lobby__code-display">
              <p className="game-lobby__code-value">
                {gameCode}
              </p>
              <p className="game-lobby__code-hint">
                Partagez ce code avec vos amis
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="game-lobby__copy-button"
            >
              {copied ? (
                <>
                  <Check className="game-lobby__copy-button-icon" />
                  <span>Code copié !</span>
                </>
              ) : (
                <>
                  <Copy className="game-lobby__copy-button-icon" />
                  <span>Copier le code</span>
                </>
              )}
            </button>
          </div>

          <div className="game-lobby__card">
            <h3 className="game-lobby__rules-title">
              Règles
            </h3>

            <ul className="game-lobby__rules-list">
              <li className="game-lobby__rules-item">
                <span className="game-lobby__rules-item-bullet">•</span>
                <span>Minimum 2 joueurs pour commencer</span>
              </li>
              <li className="game-lobby__rules-item">
                <span className="game-lobby__rules-item-bullet">•</span>
                <span>Maximum 6 joueurs par partie</span>
              </li>
              <li className="game-lobby__rules-item">
                <span className="game-lobby__rules-item-bullet">•</span>
                <span>Tour par tour : devinez les joueurs</span>
              </li>
              <li className="game-lobby__rules-item">
                <span className="game-lobby__rules-item-bullet">•</span>
                <span>Chaque bonne réponse = 1 point</span>
              </li>
              <li className="game-lobby__rules-item">
                <span className="game-lobby__rules-item-bullet">•</span>
                <span>Le joueur avec le plus de points gagne !</span>
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

