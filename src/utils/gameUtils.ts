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

// Vérifier si une réponse est correcte (insensible à la casse, aux accents, et accepte les correspondances partielles)
export function checkAnswer(guess: string, correctPlayer: Player): boolean {
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .trim()
      .replace(/\s+/g, ' '); // Normaliser les espaces multiples
  };

  const normalizedGuess = normalizeString(guess);
  const normalizedName = normalizeString(correctPlayer.nom);
  
  // Correspondance exacte
  if (normalizedGuess === normalizedName) {
    return true;
  }
  
  // vérifie si le nom complet contient la réponse (ex: "Angel Di Maria" contient "Di Maria")
  if (normalizedName.includes(normalizedGuess) && normalizedGuess.length >= 3) {
    return true;
  }
  
  // vérifie si la réponse contient le nom complet (ex: "Di Maria Angel" contient "Angel Di Maria")
  if (normalizedGuess.includes(normalizedName)) {
    return true;
  }
  
  // Extraire les mots du nom complet et de la réponse
  const nameWords = normalizedName.split(' ').filter(word => word.length > 0);
  const guessWords = normalizedGuess.split(' ').filter(word => word.length > 0);
  
  // Si la réponse contient au moins 2 mots et qu'ils correspondent tous au nom
  if (guessWords.length >= 2) {
    const allWordsMatch = guessWords.every(guessWord => 
      nameWords.some(nameWord => nameWord === guessWord || nameWord.includes(guessWord) || guessWord.includes(nameWord))
    );
    if (allWordsMatch) {
      return true;
    }
  }
  
  // Vérifier si le dernier mot (nom de famille) correspond
  if (nameWords.length > 0 && guessWords.length > 0) {
    const lastName = nameWords[nameWords.length - 1];
    const guessLastWord = guessWords[guessWords.length - 1];
    
    // Si le dernier mot de la réponse correspond au nom de famille
    if (lastName === guessLastWord || lastName.includes(guessLastWord) || guessLastWord.includes(lastName)) {
      // Vérifier aussi si c'est un nom de famille commun (au moins 4 caractères pour éviter les faux positifs)
      if (lastName.length >= 4 || guessLastWord.length >= 4) {
        return true;
      }
    }
  }
  
  return false;
}


