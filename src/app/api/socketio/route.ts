import { NextRequest } from 'next/server';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

const io = new ServerIO({
  path: '/api/socketio',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO:', socket.id);

  socket.on('join-game', (gameId: string) => {
    socket.join(`game-${gameId}`);
    console.log(`Socket ${socket.id} a rejoint la partie ${gameId}`);
    
    socket.to(`game-${gameId}`).emit('player-joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('leave-game', (gameId: string) => {
    socket.leave(`game-${gameId}`);
    console.log(`Socket ${socket.id} a quitté la partie ${gameId}`);
    
    socket.to(`game-${gameId}`).emit('player-left', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('new-turn', (data: { gameId: string; currentPlayerId: string; turn: number }) => {

    io.to(`game-${data.gameId}`).emit('turn-updated', {
      currentPlayerId: data.currentPlayerId,
      turn: data.turn,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('score-updated', (data: { gameId: string; playerId: string; score: number }) => {
    console.log(`Score mis à jour pour le joueur ${data.playerId}: ${data.score} points`);
    
    io.to(`game-${data.gameId}`).emit('scores-updated', {
      playerId: data.playerId,
      score: data.score,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('new-question', (data: { gameId: string; playerData: any }) => {
    console.log(`Nouvelle question dans la partie ${data.gameId}`);
    
    io.to(`game-${data.gameId}`).emit('question-updated', {
      playerData: data.playerData,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('guess-submitted', (data: { gameId: string; playerId: string; guess: string; isCorrect: boolean }) => {
    console.log(`Réponse soumise par ${data.playerId}: ${data.guess} (${data.isCorrect ? 'correct' : 'incorrect'})`);
    
    io.to(`game-${data.gameId}`).emit('guess-result', {
      playerId: data.playerId,
      guess: data.guess,
      isCorrect: data.isCorrect,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('game-ended', (data: { gameId: string; winner: any; finalScores: any[] }) => {
    console.log(`test partie ${data.gameId} terminée. Vainqueur: ${data.winner?.user?.username}`);
    
    io.to(`game-${data.gameId}`).emit('game-finished', {
      winner: data.winner,
      finalScores: data.finalScores,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('Déconnexion Socket.IO:', socket.id);
  });
});

export async function GET(request: NextRequest) {
  return new Response('Socket.IO server running', { status: 200 });
}

export async function POST(request: NextRequest) {
  return new Response('Socket.IO server running', { status: 200 });
}
