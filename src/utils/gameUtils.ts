import { Player, Difficulty } from '@/types';
import playersData from '@/data/players.json';

// filtrer joueurs selon difficulté
export function getPlayersByDifficulty(difficulty: Difficulty): Player[] {
  return playersData.filter(player => player.difficulte === difficulty) as Player[];
}

// obtenir joueur aléatoire selon difficulté
export function getRandomPlayer(difficulty: Difficulty): Player {
  const players = getPlayersByDifficulty(difficulty);
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex] as Player;
}

// vérifier si réponse correcte (insensible casse, accents, accepte correspondances partielles)
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
  
  // longueur min pr éviter faux positifs (min 3 caractères)
  const MIN_LENGTH = 3;
  if (normalizedGuess.length < MIN_LENGTH) {
    return false;
  }
  
  // correspondance exacte
  if (normalizedGuess === normalizedName) {
    return true;
  }
  
  // extraire mots du nom complet et de la réponse
  const nameWords = normalizedName.split(' ').filter(word => word.length > 0);
  const guessWords = normalizedGuess.split(' ').filter(word => word.length > 0);
  
  // vérifie si un mot de la réponse correspond exactement à un mot du nom
  const hasExactWordMatch = guessWords.some(guessWord => 
    guessWord.length >= MIN_LENGTH && nameWords.some(nameWord => nameWord === guessWord)
  );
  if (hasExactWordMatch) {
    return true;
  }
  
  // vérifie si nom complet contient la réponse (ex: "Angel Di Maria" contient "Di Maria")
  // exige min 4 caractères pr correspondances partielles
  if (normalizedName.includes(normalizedGuess) && normalizedGuess.length >= 4) {
    return true;
  }
  
  // vérifie si réponse contient nom complet (ex: "Di Maria Angel" contient "Angel Di Maria")
  if (normalizedGuess.includes(normalizedName)) {
    return true;
  }
  
  // si réponse contient min 2 mots et qu'ils correspondent tous au nom (correspondance exacte mots)
  if (guessWords.length >= 2) {
    const allWordsMatch = guessWords.every(guessWord => 
      guessWord.length >= MIN_LENGTH && nameWords.some(nameWord => nameWord === guessWord)
    );
    if (allWordsMatch) {
      return true;
    }
  }
  
  // vérifier si nom de famille correspond (dernier mot)
  if (nameWords.length > 0 && guessWords.length > 0) {
    const lastName = nameWords[nameWords.length - 1];
    const guessLastWord = guessWords[guessWords.length - 1];
    
    // correspondance exacte nom de famille
    if (guessLastWord.length >= MIN_LENGTH && lastName === guessLastWord) {
      return true;
    }
    
    // correspondance partielle seulement si mot tapé fait min 4 caractères
    // et représente min 70% du nom de famille
    if (guessLastWord.length >= 4) {
      const minMatchLength = Math.ceil(lastName.length * 0.7);
      if (guessLastWord.length >= minMatchLength) {
        if (lastName.startsWith(guessLastWord) || guessLastWord.startsWith(lastName)) {
          return true;
        }
      }
    }
  }
  
  return false;
}


