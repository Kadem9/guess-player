let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // ajout du token dans les cookies
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur API' }));
    throw new Error(error.error || 'Erreur API');
  }

  return response.json();
}

export const gameApi = {
  create: (settings?: any) => apiCall('/api/games/create', { 
    method: 'POST',
    body: JSON.stringify(settings || {}),
  }),
  
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
  
  removePlayer: (id: string, playerId: string) => apiCall(`/api/games/${id}/remove-player`, {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  }),
  
  forfeit: (id: string) => apiCall(`/api/games/${id}/forfeit`, {
    method: 'POST',
  }),
};


