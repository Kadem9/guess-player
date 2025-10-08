const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur API');
  }

  return response.json();
}

export const gameApi = {
  create: () => apiCall('/api/games/create', { method: 'POST' }),
  
  join: (gameId: string) => apiCall('/api/games/join', {
    method: 'POST',
    body: JSON.stringify({ gameId }),
  }),
  
  get: (id: string) => apiCall(`/api/games/${id}`),
  
  start: (id: string) => apiCall(`/api/games/${id}/start`, { method: 'POST' }),
  
  updateScore: (id: string, playerId: string, isCorrect: boolean) => apiCall(`/api/games/${id}/score`, {
    method: 'POST',
    body: JSON.stringify({ playerId, isCorrect }),
  }),
  
  updateTurn: (id: string, turn: number) => apiCall(`/api/games/${id}/turn`, {
    method: 'POST',
    body: JSON.stringify({ turn }),
  }),
};


