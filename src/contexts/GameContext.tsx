'use client';

import React, { createContext, useContext, useState } from 'react';
import { Game, GameContextType } from '@/types';
import { gameApi } from '@/lib/api';

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const joinGameHandler = async (gameId: string): Promise<void> => {
    try {
      const data = await gameApi.join(gameId);
      setCurrentGame(data.game);
    } catch (error) {
      console.error('Erreur lors de la connexion à la partie:', error);
      throw error;
    }
  };

  const createGameHandler = async (settings?: any): Promise<string> => {
    try {
      const data = await gameApi.create(settings);
      setCurrentGame(data.game);
      return data.game.id;
    } catch (error) {
      console.error('Erreur lors de la création de la partie:', error);
      throw error;
    }
  };

  const leaveGameHandler = () => {
    setCurrentGame(null);
  };

  const makeGuessHandler = async (guess: string, playerId: string): Promise<boolean> => {
    try {
      if (!currentGame) throw new Error('Aucune partie active');

      return false;
    } catch (error) {
      console.error('Erreur lors de la tentative:', error);
      throw error;
    }
  };

  const value: GameContextType = {
    currentGame,
    joinGame: joinGameHandler,
    createGame: createGameHandler,
    leaveGame: leaveGameHandler,
    makeGuess: makeGuessHandler,
    emitNewTurn: () => {},
    emitScoreUpdate: () => {},
    emitNewQuestion: () => {},
    emitGameEnded: () => {},
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
