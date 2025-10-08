import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(gameId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      : 'http://localhost:3000', {
      path: '/api/socketio',
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Connecté à Socket.IO');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Déconnecté de Socket.IO');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinGame = (gameId: string) => {
    if (socket) {
      socket.emit('join-game', gameId);
    }
  };

  const leaveGame = (gameId: string) => {
    if (socket) {
      socket.emit('leave-game', gameId);
    }
  };

  const emitNewTurn = (gameId: string, currentPlayerId: string, turn: number) => {
    if (socket) {
      socket.emit('new-turn', { gameId, currentPlayerId, turn });
    }
  };

  const emitScoreUpdate = (gameId: string, playerId: string, score: number) => {
    if (socket) {
      socket.emit('score-updated', { gameId, playerId, score });
    }
  };

  const emitNewQuestion = (gameId: string, playerData: any) => {
    if (socket) {
      socket.emit('new-question', { gameId, playerData });
    }
  };

  const emitGuessSubmitted = (gameId: string, playerId: string, guess: string, isCorrect: boolean) => {
    if (socket) {
      socket.emit('guess-submitted', { gameId, playerId, guess, isCorrect });
    }
  };

  const emitGameEnded = (gameId: string, winner: any, finalScores: any[]) => {
    if (socket) {
      socket.emit('game-ended', { gameId, winner, finalScores });
    }
  };

  return {
    socket,
    isConnected,
    joinGame,
    leaveGame,
    emitNewTurn,
    emitScoreUpdate,
    emitNewQuestion,
    emitGuessSubmitted,
    emitGameEnded,
  };
}
