// Types pour l'authentification
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  username: string;
  createdAt: Date;
  isEmailVerified: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  username: string;
  password: string;
}

// Types pour le jeu
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Player {
  id: string;
  nom: string;
  equipe: string;
  position: string;
  nationalite: string;
  image?: string;
  indice?: string;
  difficulte: Difficulty;
}

export interface Game {
  id: string; // UUID
  creatorId: string;
  players: GamePlayer[];
  currentTurn: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  maxPlayers: number;
  maxTurns: number;
  difficulty: Difficulty;
  timePerTurn: number;
  createdAt: Date;
  winner?: string;
}

export interface GamePlayer {
  id: string;
  userId: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    username: string;
  };
  score: number;
  isHost: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  maxTurns: number;
  difficulty: Difficulty;
  timePerTurn: number;
}

export interface GameContextType {
  currentGame: Game | null;
  joinGame: (gameId: string) => Promise<void>;
  createGame: () => Promise<string>;
  leaveGame: () => void;
  makeGuess: (guess: string, playerId: string) => Promise<boolean>;
  emitNewTurn: (gameId: string, currentPlayerId: string, turn: number) => void;
  emitScoreUpdate: (gameId: string, playerId: string, score: number) => void;
  emitNewQuestion: (gameId: string, playerData: any) => void;
  emitGameEnded: (gameId: string, winner: any, finalScores: any[]) => void;
}

// Types pour les scores
export interface ScoreHistory {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  rank: number;
  playedAt: Date;
}
