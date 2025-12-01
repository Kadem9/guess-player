'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gameApi } from '@/lib/api';
import { GameSettings, Difficulty } from '@/types';

export function CreateGame() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const data = await gameApi.create(settings);
      router.push(`/game/${data.game.id}`);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création de la partie');
      setCreating(false);
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'EASY':
        return 'Facile';
      case 'MEDIUM':
        return 'Moyen';
      case 'HARD':
        return 'Difficile';
      default:
        return difficulty;
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
    <main className="create-game">
      <button
        onClick={() => router.push('/dashboard')}
        className="create-game__back"
      >
        <ArrowLeft className="create-game__back-icon" />
        Retour au Dashboard
      </button>

      <div className="create-game__card">
        <h1 className="create-game__title">
          Créer une nouvelle partie
        </h1>

        {error && (
          <div className="create-game__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-game__form">
          <div className="create-game__config">
            <h3 className="create-game__config-title">
              Configuration de la partie
            </h3>

            <div className="create-game__config-grid">
              <div className="create-game__field">
                <label className="create-game__label">
                  <span className="create-game__label-text">
                    Nombre maximum de joueurs
                  </span>
                </label>
                <select
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                  className="create-game__select"
                >
                  <option value={2}>2 joueurs</option>
                  <option value={3}>3 joueurs</option>
                  <option value={4}>4 joueurs</option>
                  <option value={5}>5 joueurs</option>
                  <option value={6}>6 joueurs</option>
                </select>
              </div>

              <div className="create-game__field">
                <label className="create-game__label">
                  <span className="create-game__label-text">
                    Nombre de tours
                  </span>
                </label>
                <select
                  value={settings.maxTurns}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxTurns: parseInt(e.target.value) }))}
                  className="create-game__select"
                >
                  <option value={5}>5 tours</option>
                  <option value={10}>10 tours</option>
                  <option value={15}>15 tours</option>
                  <option value={20}>20 tours</option>
                </select>
              </div>

              <div className="create-game__field">
                <label className="create-game__label">
                  <span className="create-game__label-text">
                    Niveau de difficulté
                  </span>
                </label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                  className="create-game__select"
                >
                  <option value="EASY">Facile</option>
                  <option value="MEDIUM">Moyen</option>
                  <option value="HARD">Difficile</option>
                </select>
              </div>

              <div className="create-game__field">
                <label className="create-game__label">
                  <span className="create-game__label-text">
                    Temps par réponse (secondes)
                  </span>
                </label>
                <select
                  value={settings.timePerTurn}
                  onChange={(e) => setSettings(prev => ({ ...prev, timePerTurn: parseInt(e.target.value) }))}
                  className="create-game__select"
                >
                  <option value={15}>15 secondes</option>
                  <option value={30}>30 secondes</option>
                  <option value={45}>45 secondes</option>
                  <option value={60}>60 secondes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="create-game__summary">
            <h3 className="create-game__summary-title">
              Résumé de votre partie
            </h3>
            <ul className="create-game__summary-list">
              <li className="create-game__summary-item">
                Maximum {settings.maxPlayers} joueurs
              </li>
              <li className="create-game__summary-item">
                {settings.maxTurns} tours au total
              </li>
              <li className="create-game__summary-item">
                Niveau : {getDifficultyLabel(settings.difficulty)}
              </li>
              <li className="create-game__summary-item">
                Temps par réponse : {settings.timePerTurn} secondes
              </li>
              <li className="create-game__summary-item">
                Un code unique sera généré pour votre partie
              </li>
              <li className="create-game__summary-item">
                Partagez ce code avec vos amis pour qu&apos;ils rejoignent
              </li>
            </ul>
          </div>

          <div className="create-game__host-info">
            <h3 className="create-game__host-title">
              Vous serez l&apos;hôte
            </h3>
            <p className="create-game__host-text">
              En tant qu&apos;hôte, vous pourrez lancer la partie quand tous les joueurs seront prêts.
            </p>
          </div>

          <div className="create-game__submit">
            <button
              type="submit"
              disabled={creating}
              className="create-game__button create-game__button--primary"
            >
              {creating ? 'Création...' : 'Créer la partie'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

