'use client';

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/utils';

export function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ general: error.message || 'Erreur de connexion' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth__container">
        <div className="auth__header">
          <div className="auth__logo">
            <span className="auth__logo-text">GP</span>
          </div>
          <h1 className="auth__title">
            Connexion
          </h1>
          <p className="auth__subtitle">
            Connectez-vous pour jouer
          </p>
        </div>

        <div className="auth__card">
          <form onSubmit={handleSubmit} className="auth__form">
            {errors.general && (
              <div className="auth__alert auth__alert--error">
                {errors.general}
              </div>
            )}

            <div className="auth__field">
              <label className="auth__label">
                Email
              </label>
              <div className="auth__input-wrapper">
                <Mail className="auth__input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={`auth__input ${errors.email ? 'auth__input--error' : ''}`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.email && (
                <span className="auth__error">{errors.email}</span>
              )}
            </div>

            <div className="auth__field">
              <label className="auth__label">
                Mot de passe
              </label>
              <div className="auth__input-wrapper">
                <Lock className="auth__input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`auth__input ${errors.password ? 'auth__input--error' : ''}`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.password && (
                <span className="auth__error">{errors.password}</span>
              )}
            </div>

            <div className="auth__forgot-password">
              <button
                type="button"
                className="auth__forgot-link"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth__submit auth__submit--primary"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="auth__footer">
            <p className="auth__footer-text">
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="auth__footer-link"
              >
                S&apos;inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

