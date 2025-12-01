'use client';

import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/types';
import { isValidEmail, isValidPassword } from '@/utils';

export function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    nom: '',
    prenom: '',
    email: '',
    username: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Nom requis';
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Prénom requis';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Nom d&apos;utilisateur requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Au moins 3 caractères';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Min 8 caractères, 1 majuscule, 1 chiffre';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await register(formData);
      setSuccessMessage(result.message);
      setErrors({});
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        username: '',
        password: '',
      });
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setErrors({ general: error.message || 'Erreur lors de l&apos;inscription' });
      setSuccessMessage('');
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
            Créer un compte
          </h1>
          <p className="auth__subtitle">
            Rejoignez la communauté Guess Player
          </p>
        </div>

        <div className="auth__card">
          <form onSubmit={handleSubmit} className="auth__form">
            {successMessage && (
              <div className="auth__alert auth__alert--success">
                {successMessage}
              </div>
            )}
            
            {errors.general && (
              <div className="auth__alert auth__alert--error">
                {errors.general}
              </div>
            )}

            <div className="auth__grid">
              <div className="auth__field">
                <label className="auth__label">
                  Prénom
                </label>
                <input
                  type="text"
                  placeholder="Jean"
                  className={`auth__input ${errors.prenom ? 'auth__input--error' : ''}`}
                  value={formData.prenom}
                  onChange={handleInputChange('prenom')}
                  disabled={isLoading}
                  required
                />
                {errors.prenom && (
                  <span className="auth__error">{errors.prenom}</span>
                )}
              </div>

              <div className="auth__field">
                <label className="auth__label">
                  Nom
                </label>
                <input
                  type="text"
                  placeholder="Dupont"
                  className={`auth__input ${errors.nom ? 'auth__input--error' : ''}`}
                  value={formData.nom}
                  onChange={handleInputChange('nom')}
                  disabled={isLoading}
                  required
                />
                {errors.nom && (
                  <span className="auth__error">{errors.nom}</span>
                )}
              </div>
            </div>

            <div className="auth__field">
              <label className="auth__label">
                Email
              </label>
              <div className="auth__input-wrapper">
                <Mail className="auth__input-icon" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
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
                Nom d&apos;utilisateur
              </label>
              <div className="auth__input-wrapper">
                <User className="auth__input-icon" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  placeholder="votre_pseudo"
                  className={`auth__input ${errors.username ? 'auth__input--error' : ''}`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.username && (
                <span className="auth__error">{errors.username}</span>
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
                  value={formData.password}
                  onChange={handleInputChange('password')}
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

            <div className="auth__field">
              <label className="auth__label">
                Confirmer le mot de passe
              </label>
              <div className="auth__input-wrapper">
                <Lock className="auth__input-icon" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`auth__input ${errors.confirmPassword ? 'auth__input--error' : ''}`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <span className="auth__error">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth__submit auth__submit--primary"
            >
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>

          <div className="auth__footer">
            <p className="auth__footer-text">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="auth__footer-link"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

