'use client';

import { Plus, UserPlus, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ActionCards() {
  const router = useRouter();

  return (
    <div className="action-cards">
      <div className="action-cards__card">
        <div className="action-cards__icon-wrapper action-cards__icon-wrapper--blue">
          <Plus className="action-cards__icon" />
        </div>
        <h3 className="action-cards__card-title">
          Créer une partie
        </h3>
        <p className="action-cards__card-description">
          Lancez une nouvelle partie et invitez vos amis
        </p>
        <button 
          onClick={() => router.push('/game/create')}
          className="action-cards__button action-cards__button--primary"
        >
          Créer
        </button>
      </div>

      <div className="action-cards__card">
        <div className="action-cards__icon-wrapper action-cards__icon-wrapper--purple">
          <UserPlus className="action-cards__icon" />
        </div>
        <h3 className="action-cards__card-title">
          Rejoindre une partie
        </h3>
        <p className="action-cards__card-description">
          Entrez le code d&apos;une partie existante
        </p>
        <button 
          onClick={() => router.push('/game/join')}
          className="action-cards__button action-cards__button--secondary"
        >
          Rejoindre
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
  );
}

