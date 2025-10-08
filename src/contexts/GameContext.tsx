'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Game, GameContextType } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from './AuthContext';
import { gameApi } from '@/lib/api';

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const { socket, joinGame, leaveGame, emitNewTurn, emitScoreUpdate, emitNewQuestion, emitGuessSubmitted, emitGameEnded } = useSocket(token);

  useEffect(() => {
    if (!socket) return;

    socket.on('turn-updated', (data) => {
      setCurrentGame(prev => prev ? {
        ...prev,
        currentTurn: data.turn,
      } : null);
    });

    socket.on('scores-updated', (data) => {
      setCurrentGame(prev => prev ? {
        ...prev,
        players: prev.players.map(player => 
          player.userId === data.playerId 
            ? { ...player, score: data.score }
            : player
        ),
      } : null);
    });

    socket.on('question-updated', (data) => {
    });

    socket.on('guess-result', (data) => {
    });

    socket.on('game-finished', (data) => {
    });

    return () => {
      socket.off('turn-updated');
      socket.off('scores-updated');
      socket.off('question-updated');
      socket.off('guess-result');
      socket.off('game-finished');
    };
  }, [socket]);

  const joinGameSocket = async (gameId: string): Promise<void> => {
    try {
      const data = await gameApi.join(gameId);
      setCurrentGame(data.game);
      // Rejoindre la room Socket.IO
      joinGame(gameId);
    } catch (error) {
      console.error('Erreur lors de la connexion à la partie:', error);
      throw error;
    }
  };

  const createGameSocket = async (): Promise<string> => {
    try {
      const data = await gameApi.create();
      setCurrentGame(data.game);
      // Rejoindre la room Socket.IO
      joinGame(data.game.id);
      return data.game.id;
    } catch (error) {
      console.error('Erreur lors de la création de la partie:', error);
      throw error;
    }
  };

  const leaveGameSocket = () => {
    if (currentGame) {
      leaveGame(currentGame.id);
    }
    setCurrentGame(null);
    console.log('Partie quittée');
  };

  const makeGuessSocket = async (guess: string, playerId: string): Promise<boolean> => {
    try {
      if (!currentGame) throw new Error('Aucune partie active');
      
      // TODO: Vérifier la réponse avec l'API
      const isCorrect = true;
      
      emitGuessSubmitted(currentGame.id, playerId, guess, isCorrect);
      
      return isCorrect;
    } catch (error) {
      console.error('Erreur lors de la tentative:', error);
      throw error;
    }
  };

  const value: GameContextType = {
    currentGame,
    joinGame: joinGameSocket,
    createGame: createGameSocket,
    leaveGame: leaveGameSocket,
    makeGuess: makeGuessSocket,
    emitNewTurn: (gameId: string, currentPlayerId: string, turn: number) => {
      emitNewTurn(gameId, currentPlayerId, turn);
    },
    emitScoreUpdate: (gameId: string, playerId: string, score: number) => {
      emitScoreUpdate(gameId, playerId, score);
    },
    emitNewQuestion: (gameId: string, playerData: any) => {
      emitNewQuestion(gameId, playerData);
    },
    emitGameEnded: (gameId: string, winner: any, finalScores: any[]) => {
      emitGameEnded(gameId, winner, finalScores);
    },
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
