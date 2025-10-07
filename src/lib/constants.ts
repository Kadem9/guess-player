export const APP_CONFIG = {
  name: 'Guess Player',
  description: 'Jeu de devinettes de footballeurs en mode tour par tour',
  version: '1.0.0',
  maxPlayersPerGame: 6,
  minPlayersPerGame: 2,
  timePerTurn: 30,
  maxRounds: 10,
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  game: '/game/[id]',
  leaderboard: '/leaderboard',
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    verify: '/api/auth/verify',
  },
  games: {
    create: '/api/games/create',
    join: '/api/games/join',
    leave: '/api/games/leave',
    get: '/api/games/[id]',
  },
  players: {
    list: '/api/players',
  },
  scores: {
    history: '/api/scores/history',
    leaderboard: '/api/scores/leaderboard',
  },
} as const;

export const THEMES = {
  light: 'light',
  dark: 'dark',
  cupcake: 'cupcake',
  forest: 'forest',
  luxury: 'luxury',
} as const;
