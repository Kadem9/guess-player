'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Copy, Users, Calendar, Check, Clock, Trophy, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { gameApi } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Chat } from '@/components/game/Chat';

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
  const { socket, isConnected, joinGame, leaveGame } = useSocketContext();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const leavingRef = useRef(false);

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

  // chargement initial
  useEffect(() => {
    if (user && gameId) {
      fetchGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gameId]);

  // id complet de la partie
  const fullGameId = useMemo(() => game?.id, [game?.id]);

  // join room socket avec id complet et infos utilisateur
  useEffect(() => {
    if (isConnected && fullGameId && user && game) {
      const playerInGame = game.players.find(p => p.userId === user.id);
      const userIsHost = playerInGame?.isHost || false;
      
      joinGame(fullGameId, user.id, userIsHost);

      return () => {
        leaveGame(fullGameId);
        // le serveur socket gère le retrait de la DB quand le socket se déconnecte
      };
    }
  }, [isConnected, fullGameId, joinGame, leaveGame, user?.id, game?.players]);

  // note: la déconnexion est gérée côté serveur socket
  // quand un socket se déconnecte, le serveur appelle l'API pour retirer le joueur

  // écouter events socket
  useEffect(() => {
    if (!socket || !game) return;

    const handleGameUpdated = ({ gameId: updatedGameId }: { gameId: string }) => {
      if (updatedGameId.toLowerCase() === game.id.toLowerCase()) {
        // reload données partie
        fetch(`/api/games/${gameId}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.game) {
              // si partie annulée, rediriger au dashboard
              if (data.game.status === 'CANCELLED') {
                router.push('/dashboard');
                return;
              }
              
              // vérifier si l'utilisateur est toujours dans la partie
              const userStillInGame = data.game.players.some((p: any) => p.userId === user?.id);
              if (!userStillInGame) {
                router.push('/dashboard');
                return;
              }
              
              setGame(data.game);
              setIsHost(data.isHost);
            } else {
              // si pas de game retourné, l'utilisateur n'est plus dans la partie
              router.push('/dashboard');
            }
          })
          .catch(err => {
            console.error('[CLIENT] [LOBBY] Erreur rechargement partie:', err);
            // si erreur 403, l'utilisateur n'a plus accès
            if (err.message?.includes('403') || err.message?.includes('Non autorisé')) {
              router.push('/dashboard');
            }
          });
      }
    };

    const handleGameStarted = ({ gameId: startedGameId }: { gameId: string }) => {
      if (startedGameId.toLowerCase() === game.id.toLowerCase()) {
        router.push(`/game/${game.id}/play`);
      }
    };

    socket.on('game-updated', handleGameUpdated);
    socket.on('game-started', handleGameStarted);

    return () => {
      socket.off('game-updated', handleGameUpdated);
      socket.off('game-started', handleGameStarted);
    };
  }, [socket, game?.id, gameId, router]);

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

      // api emit déjà event socket game-started
      // tous les joueurs (y compris hôte) recevront event et redirigeront
      // on met pas setStarting(false) car redirection va se faire via event
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

  const handleLeaveGame = async () => {
    if (!game || !user) {
      return;
    }

    if (leavingRef.current) {
      return;
    }

    leavingRef.current = true;

    // si partie en cours, afficher modal confirmation
    if (game.status === 'IN_PROGRESS') {
      leavingRef.current = false;
      setShowForfeitModal(true);
      return;
    }

    // si partie en attente, retirer le joueur immédiatement
    if (game.status === 'WAITING') {
      try {
        const response = await fetch(`/api/games/${gameId}/leave`, {
          method: 'POST',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          // si partie annulée (hôte parti ou plus assez de joueurs), rediriger direct
          if (data.gameCancelled) {
            router.push('/dashboard');
            return;
          }
          // sinon, event socket déjà émis par l'api, les autres joueurs seront notifiés
          // rediriger après un court délai pour laisser le temps à l'event socket d'être émis
          setTimeout(() => {
            router.push('/dashboard');
          }, 100);
          return;
        } else {
          leavingRef.current = false;
          console.error('[CLIENT] [LOBBY] Erreur quitter partie:', data.error);
        }
      } catch (error) {
        leavingRef.current = false;
        console.error('[CLIENT] [LOBBY] Erreur quitter partie:', error);
      }
    }

    // fallback: redirection directe si pas WAITING
    router.push('/dashboard');
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!game || !isHost || game.status !== 'WAITING') return;

    setRemovingPlayerId(playerId);
    try {
      const response = await fetch(`/api/games/${gameId}/remove-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // émettre event socket pr notifier les autres
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        try {
          await fetch(`${socketUrl}/emit/game-updated`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: game.id }),
          });
        } catch (socketError) {
          console.error('Erreur émission socket:', socketError);
        }

        // recharger les données
        await fetchGame();
      } else {
        console.error('Erreur exclusion joueur:', data.error);
        alert(data.error || 'Erreur lors de l\'exclusion du joueur');
      }
    } catch (error) {
      console.error('Erreur exclusion joueur:', error);
      alert('Erreur lors de l\'exclusion du joueur');
    } finally {
      setRemovingPlayerId(null);
    }
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

      // redir vers résultats
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
                    <div className="game-lobby__player-stats">
                      <Trophy className="game-lobby__player-stats-icon" size={16} />
                      <span className="game-lobby__player-score">
                        {player.victories || 0}
                      </span>
                      <span className="game-lobby__player-stats-label">victoire{(player.victories || 0) > 1 ? 's' : ''}</span>
                    </div>
                    {isHost && game.status === 'WAITING' && !player.isHost && (
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={removingPlayerId === player.id}
                        className="game-lobby__remove-button"
                        title="Exclure ce joueur"
                      >
                        {removingPlayerId === player.id ? (
                          <div className="game-lobby__remove-button-spinner"></div>
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    )}
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
                  {starting ? 'Démarrage...' : game.players.length < 2 ? 'En attente de joueurs...' : 'Lancer la partie'}
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

      <Chat gameId={game?.id || gameId} />
    </main>
  );
}

