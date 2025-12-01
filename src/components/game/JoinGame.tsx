'use client';

import { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gameApi } from '@/lib/api';

export function JoinGame() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError('');

    if (!gameCode.trim()) {
      setError('Veuillez entrer un code de partie');
      setJoining(false);
      return;
    }

    try {
      const data = await gameApi.join(gameCode.trim().toUpperCase());
      
      if (data.alreadyInGame) {
        const gameStatus = data.game.status;
        if (gameStatus === 'IN_PROGRESS') {
          router.push(`/game/${data.game.id}/play`);
        } else if (gameStatus === 'FINISHED') {
          router.push(`/game/${data.game.id}/results`);
        } else {
          router.push(`/game/${data.game.id}`);
        }
      } else {
        router.push(`/game/${gameCode.trim().toUpperCase()}`);
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la connexion à la partie');
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="u-flex u-flex--center u-min-h-screen">
        <div className="user-stats__spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="join-game">
      <button
        onClick={() => router.push('/dashboard')}
        className="join-game__back"
      >
        <ArrowLeft className="join-game__back-icon" />
        Retour au Dashboard
      </button>

      <div className="join-game__card">
        <h1 className="join-game__title">
          Rejoindre une partie
        </h1>

        {error && (
          <div className="join-game__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="join-game__form">
          <div className="join-game__field">
            <label className="join-game__label">
              <span className="join-game__label-text">
                Code de la partie
              </span>
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Entrez le code (ex: clxyz123)"
              className="join-game__input"
              disabled={joining}
              maxLength={20}
            />
            <p className="join-game__hint">
              Demandez le code à l&apos;hôte de la partie
            </p>
          </div>

          <div className="join-game__info">
            <div className="join-game__info-header">
              <Info className="join-game__info-icon" />
              <h3 className="join-game__info-title">
                Informations
              </h3>
            </div>
            <ul className="join-game__info-list">
              <li className="join-game__info-item">
                <span className="join-game__info-item-bullet">•</span>
                <span>Vous rejoindrez la partie en tant que joueur</span>
              </li>
              <li className="join-game__info-item">
                <span className="join-game__info-item-bullet">•</span>
                <span>Attendez que l&apos;hôte lance la partie</span>
              </li>
              <li className="join-game__info-item">
                <span className="join-game__info-item-bullet">•</span>
                <span>Devinez un maximum de joueurs pour gagner !</span>
              </li>
            </ul>
          </div>

          <div className="join-game__submit">
            <button
              type="submit"
              disabled={!gameCode.trim() || joining}
              className="join-game__button join-game__button--primary"
            >
              {joining ? 'Connexion...' : 'Rejoindre'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

