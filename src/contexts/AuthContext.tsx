'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, RegisterData } from '@/types';

// contexte d'authent
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // on vérifie si l'utilisateur est connecté au chargement
  useEffect(() => {
    // TODO: Vérifier le token JWT dans le localStorage
    const token = localStorage.getItem('auth-token');
    if (token) {
      console.log('token trouvé, vérification en cours...');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Appel API pour se connecter
      console.log('Tentative de connexion:', email);
      
      // simul temporaire
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: lorsque je j'aurais je rempalce par la vraie logique d'authentification
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      
      throw new Error('API non implémentée encore');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Appel API pour s'inscrire
      console.log('Tentative d\'inscription:', userData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      throw new Error('API non implémentée encore');
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
