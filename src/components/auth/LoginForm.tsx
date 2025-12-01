'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/utils';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

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
      // TODO: redirection vers dashboard après connexion
    } catch (error: any) {
      setErrors({ general: error.message || 'Erreur de connexion' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6">Connexion</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="alert alert-error">
              <span>{errors.general}</span>
            </div>
          )}
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.email}</span>
              </label>
            )}
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Mot de passe</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.password}</span>
              </label>
            )}
          </div>
          
          <div className="form-control mt-6">
            <button 
              type="submit" 
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
        
        <div className="divider">OU</div>
        
        <div className="text-center">
          <p className="text-sm">
            Pas encore de compte ?{' '}
            <button className="link link-primary" onClick={() => {/* TODO: basculer vers inscription */}}>
              S&apos;inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
