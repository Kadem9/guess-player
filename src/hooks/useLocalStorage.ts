import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      // essayer de parser en JSON, sinon retourner la valeur directe
      try {
        return JSON.parse(item);
      } catch {
        // si pas JSON valide, retourner la valeur telle quelle (pr string)
        return item as T;
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du localStorage pour la clé "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        // si c'est une string, la stocker directe, sinon stringify
        if (typeof valueToStore === 'string') {
          window.localStorage.setItem(key, valueToStore);
        } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'écriture du localStorage pour la clé "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
