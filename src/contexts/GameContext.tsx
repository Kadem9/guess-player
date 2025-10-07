'use client';

import React, { createContext, useContext, useState } from 'react';
import { Game, GameContextType } from '@/types';

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const joinGame = async (gameId: string): Promise<void> => {
    try {
      // TODO: Appel API pour rejoindre la partie
      console.log('Tentative de rejoindre la partie:', gameId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      throw new Error('API non implémentée encore');
    } catch (error) {
      console.error('Erreur lors de la connexion à la partie:', error);
      throw error;
    }
  };

  const createGame = async (): Promise<string> => {
    try {
      // TODO: Appel API pour créer une partie
      console.log('Création d\'une nouvelle partie...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      throw new Error('API non implémentée encore');
    } catch (error) {
      console.error('Erreur lors de la création de la partie:', error);
      throw error;
    }
  };

  const leaveGame = () => {
    setCurrentGame(null);
    console.log('Partie quittée');
  };

  const makeGuess = async (guess: string): Promise<boolean> => {
    try {
      // TODO: Appel API pour faire une tentative
      console.log('Tentative:', guess);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      throw new Error('API non implémentée encore');
    } catch (error) {
      console.error('Erreur lors de la tentative:', error);
      throw error;
    }
  };

  const value: GameContextType = {
    currentGame,
    joinGame,
    createGame,
    leaveGame,
    makeGuess,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame doit être utilisé dans un GameProvider');
  }
  return context;
}
