import { Player, Difficulty } from '@/types';
import playersData from '@/data/players.json';

// Filtrer les joueurs selon la difficulté
export function getPlayersByDifficulty(difficulty: Difficulty): Player[] {
  return playersData.filter(player => player.difficulte === difficulty) as Player[];
}

// Obtenir un joueur aléatoire selon la difficulté
export function getRandomPlayer(difficulty: Difficulty): Player {
  const players = getPlayersByDifficulty(difficulty);
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex] as Player;
}

// Vérifier si une réponse est correcte (insensible à la casse et aux accents)
export function checkAnswer(guess: string, correctPlayer: Player): boolean {
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .trim();
  };

  const normalizedGuess = normalizeString(guess);
  const normalizedName = normalizeString(correctPlayer.nom);
  
  return normalizedGuess === normalizedName;
}


