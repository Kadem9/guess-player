'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/types';
import { isValidEmail, isValidPassword } from '@/utils';

export default function RegisterForm() {
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
  
  const { register } = useAuth();

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
      // je reset le formulaire
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        username: '',
        password: '',
      });
      setConfirmPassword('');
    } catch (error: any) {
      setErrors({ general: error.message || 'Erreur lors de l\'inscription' });
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6">Inscription</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="alert alert-success">
              <span>{successMessage}</span>
            </div>
          )}
          
          {errors.general && (
            <div className="alert alert-error">
              <span>{errors.general}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Prénom</span>
              </label>
              <input
                type="text"
                placeholder="Jean"
                className={`input input-bordered ${errors.prenom ? 'input-error' : ''}`}
                value={formData.prenom}
                onChange={handleInputChange('prenom')}
                disabled={isLoading}
              />
              {errors.prenom && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.prenom}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom</span>
              </label>
              <input
                type="text"
                placeholder="Dupont"
                className={`input input-bordered ${errors.nom ? 'input-error' : ''}`}
                value={formData.nom}
                onChange={handleInputChange('nom')}
                disabled={isLoading}
              />
              {errors.nom && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.nom}</span>
                </label>
              )}
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="jean.dupont@email.com"
              className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={handleInputChange('email')}
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
              <span className="label-text">Nom d&apos;utilisateur</span>
            </label>
            <input
              type="text"
              placeholder="jean_dupont"
              className={`input input-bordered ${errors.username ? 'input-error' : ''}`}
              value={formData.username}
              onChange={handleInputChange('username')}
              disabled={isLoading}
            />
            {errors.username && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.username}</span>
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
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.password}</span>
              </label>
            )}
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Confirmer le mot de passe</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.confirmPassword}</span>
              </label>
            )}
          </div>
          
          <div className="form-control mt-6">
            <button 
              type="submit" 
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </div>
        </form>
        
        <div className="divider">OU</div>
        
        <div className="text-center">
          <p className="text-sm">
            Déjà un compte ?{' '}
            <button className="link link-primary" onClick={() => {/* TODO: basculer vers connexion */}}>
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
