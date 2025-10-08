'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(BACKEND_URL, {
      auth: {
        token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinGame = useCallback((gameId: string) => {
    if (socket) {
      socket.emit('join-game', gameId);
    }
  }, [socket]);

  const leaveGame = useCallback((gameId: string) => {
    if (socket) {
      socket.emit('leave-game', gameId);
    }
  }, [socket]);

  const emitNewTurn = useCallback((gameId: string, currentPlayerId: string, turn: number) => {
    if (socket) {
      socket.emit('new-turn', { gameId, currentPlayerId, turn });
    }
  }, [socket]);

  const emitScoreUpdate = useCallback((gameId: string, playerId: string, score: number) => {
    if (socket) {
      socket.emit('score-update', { gameId, playerId, score });
    }
  }, [socket]);

  const emitNewQuestion = useCallback((gameId: string, playerData: any) => {
    if (socket) {
      socket.emit('new-question', { gameId, playerData });
    }
  }, [socket]);

  const emitGuessSubmitted = useCallback((gameId: string, playerId: string, guess: string, isCorrect: boolean) => {
    if (socket) {
      socket.emit('guess-submitted', { gameId, playerId, guess, isCorrect });
    }
  }, [socket]);

  const emitGameEnded = useCallback((gameId: string, winner: any, finalScores: any[]) => {
    if (socket) {
      socket.emit('game-ended', { gameId, winner, finalScores });
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    joinGame,
    leaveGame,
    emitNewTurn,
    emitScoreUpdate,
    emitNewQuestion,
    emitGuessSubmitted,
    emitGameEnded
  };
}
