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
export interface Player {
  id: string;
  nom: string;
  equipe: string;
  position: string;
  nationalite: string;
  image?: string;
  indice?: string;
}

export interface Game {
  id: string; // UUID
  hostId: string;
  players: GamePlayer[];
  currentPlayerIndex: number;
  currentQuestion: Player | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  winner?: string;
}

export interface GamePlayer {
  userId: string;
  username: string;
  score: number;
  isHost: boolean;
  isCurrentPlayer: boolean;
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
