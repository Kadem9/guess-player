'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '@/hooks/useSocket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGame: (gameId: string, userId?: string, isHost?: boolean) => void;
  leaveGame: (gameId: string) => void;
  emitStartGame: (gameId: string) => void;
  emitAnswerSubmitted: (gameId: string, playerId: string, isCorrect: boolean) => void;
  emitTurnChanged: (gameId: string, turn: number) => void;
  emitPlayerForfeit: (gameId: string, playerId: string) => void;
  emitGameEnded: (gameId: string) => void;
  emitChatMessage: (gameId: string, userId: string, username: string, message: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();

  const joinGame = useCallback((gameId: string, userId?: string, isHost?: boolean) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      // envoyer les infos utilisateur pour que le serveur puisse gérer la déconnexion
      socket.emit('join-game', { gameId: normalizedGameId, userId, isHost });
    }
  }, [socket]);

  const leaveGame = useCallback((gameId: string) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      socket.emit('leave-game', normalizedGameId);
    }
  }, [socket]);

  const emitStartGame = useCallback((gameId: string) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      socket.emit('start-game', normalizedGameId);
    }
  }, [socket]);

  const emitAnswerSubmitted = useCallback((gameId: string, playerId: string, isCorrect: boolean) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      socket.emit('answer-submitted', { gameId: normalizedGameId, playerId, isCorrect });
    }
  }, [socket]);

  const emitTurnChanged = useCallback((gameId: string, turn: number) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      socket.emit('turn-changed', { gameId: normalizedGameId, turn });
    }
  }, [socket]);

  const emitPlayerForfeit = useCallback((gameId: string, playerId: string) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      socket.emit('player-forfeit', { gameId: normalizedGameId, playerId });
    }
  }, [socket]);

  const emitGameEnded = useCallback((gameId: string) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket) {
      socket.emit('game-ended', { gameId: normalizedGameId });
    }
  }, [socket]);

  const emitChatMessage = useCallback((gameId: string, userId: string, username: string, message: string) => {
    const normalizedGameId = gameId.toLowerCase();
    if (socket && socket.connected) {
      socket.emit('chat-message', {
        gameId: normalizedGameId,
        userId,
        username,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }, [socket]);

  const value: SocketContextType = useMemo(() => ({
    socket,
    isConnected,
    joinGame,
    leaveGame,
    emitStartGame,
    emitAnswerSubmitted,
    emitTurnChanged,
    emitPlayerForfeit,
    emitGameEnded,
    emitChatMessage,
  }), [socket, isConnected, joinGame, leaveGame, emitStartGame, emitAnswerSubmitted, emitTurnChanged, emitPlayerForfeit, emitGameEnded, emitChatMessage]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext doit être utilisé dans un SocketProvider');
  }
  return context;
}

