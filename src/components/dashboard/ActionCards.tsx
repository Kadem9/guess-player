'use client';

import { Plus, UserPlus, Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ActiveGame {
  id: string;
  code: string;
  status: 'WAITING' | 'IN_PROGRESS';
  isHost: boolean;
}

export function ActionCards() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveGame = async () => {
      try {
        const response = await fetch('/api/user/active-game', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.hasActiveGame) {
          setActiveGame(data.game);
        }
      } catch (error) {
        console.error('Erreur vérification partie active:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveGame();
  }, []);

  const handleReturnToGame = () => {
    if (activeGame) {
      if (activeGame.status === 'IN_PROGRESS') {
        router.push(`/game/${activeGame.id}/play`);
      } else {
        router.push(`/game/${activeGame.id}`);
      }
    }
  };

  return (
    <>
      {/* bandeau partie active */}
      {activeGame && (
        <div className="action-cards__active-game">
          <div className="action-cards__active-game-content">
            <AlertCircle className="action-cards__active-game-icon" />
            <div className="action-cards__active-game-text">
              <span className="action-cards__active-game-title">
                Vous êtes dans une partie
              </span>
              <span className="action-cards__active-game-code">
                Code: {activeGame.code} • {activeGame.status === 'WAITING' ? 'En attente' : 'En cours'}
              </span>
            </div>
          </div>
          <button
            onClick={handleReturnToGame}
            className="action-cards__active-game-button"
          >
            Retourner
            <ArrowRight className="action-cards__active-game-button-icon" />
          </button>
        </div>
      )}

      <div className="action-cards">
        <div className={`action-cards__card ${activeGame ? 'action-cards__card--disabled' : ''}`}>
          <div className="action-cards__icon-wrapper action-cards__icon-wrapper--blue">
            <Plus className="action-cards__icon" />
          </div>
          <h3 className="action-cards__card-title">
            Créer une partie
          </h3>
          <p className="action-cards__card-description">
            {activeGame 
              ? 'Terminez votre partie en cours pour en créer une nouvelle'
              : 'Lancez une nouvelle partie et invitez vos amis'
            }
          </p>
          <button 
            onClick={() => !activeGame && router.push('/game/create')}
            disabled={!!activeGame || loading}
            className={`action-cards__button ${activeGame ? 'action-cards__button--disabled' : 'action-cards__button--primary'}`}
          >
            {activeGame ? 'Indisponible' : 'Créer'}
          </button>
        </div>

        <div className={`action-cards__card ${activeGame ? 'action-cards__card--disabled' : ''}`}>
          <div className="action-cards__icon-wrapper action-cards__icon-wrapper--purple">
            <UserPlus className="action-cards__icon" />
          </div>
          <h3 className="action-cards__card-title">
            Rejoindre une partie
          </h3>
          <p className="action-cards__card-description">
            {activeGame 
              ? 'Terminez votre partie en cours pour en rejoindre une autre'
              : 'Entrez le code d\'une partie existante'
            }
          </p>
          <button 
            onClick={() => !activeGame && router.push('/game/join')}
            disabled={!!activeGame || loading}
            className={`action-cards__button ${activeGame ? 'action-cards__button--disabled' : 'action-cards__button--secondary'}`}
          >
            {activeGame ? 'Indisponible' : 'Rejoindre'}
          </button>
        </div>

        <div className="action-cards__card">
          <div className="action-cards__icon-wrapper action-cards__icon-wrapper--amber">
            <Trophy className="action-cards__icon" />
          </div>
          <h3 className="action-cards__card-title">
            Classement
          </h3>
          <p className="action-cards__card-description">
            Consultez les meilleurs joueurs
          </p>
          <button 
            onClick={() => router.push('/leaderboard')}
            className="action-cards__button action-cards__button--outline"
          >
            Voir
          </button>
        </div>
      </div>
    </>
  );
}

