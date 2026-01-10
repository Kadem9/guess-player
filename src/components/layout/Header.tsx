'use client';

import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push('/');
  };

  const userInitial = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : 'U';

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__content">
          <button 
            onClick={() => router.push('/')}
            className="header__logo"
            aria-label="Retour à l'accueil"
          >
            <div className="header__logo-icon">
              <span className="header__logo-icon-text">GP</span>
            </div>
            <h2 className="header__logo-text">
              Guess Player
            </h2>
          </button>

          <nav className="header__nav">
            <button
              onClick={() => router.push('/')}
              className="header__nav-item header__nav-item--active"
            >
              Accueil
            </button>
            {user && (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="header__nav-item"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="header__nav-item"
                >
                  Classement
                </button>
              </>
            )}
          </nav>

          <div className="header__actions">
            <button
              onClick={toggleTheme}
              className="header__theme-toggle"
              aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {isDark ? (
                <Sun className="header__theme-icon" />
              ) : (
                <Moon className="header__theme-icon" />
              )}
            </button>

            {user ? (
              <div className="header__user-menu" ref={dropdownRef}>
                <button 
                  className="header__user-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Menu utilisateur"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="header__user-initial">{userInitial}</span>
                </button>

                {isDropdownOpen && (
                  <div className="header__dropdown" role="menu">
                    <div className="header__dropdown-info">
                      <p className="header__dropdown-info-name">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="header__dropdown-info-role">
                        Joueur
                      </p>
                    </div>
                    <div className="header__dropdown-separator"></div>
                    <button
                      className="header__dropdown-item"
                      onClick={() => {
                        router.push('/profile');
                        setIsDropdownOpen(false);
                      }}
                    >
                      <User className="header__dropdown-item-icon" />
                      Profil
                    </button>
                    <div className="header__dropdown-separator"></div>
                    <button
                      className="header__dropdown-item header__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <LogOut className="header__dropdown-item-icon" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="u-flex u-flex--gap-sm u-hidden u-visible-md">
                <Link href="/login" className="header__button header__button--primary">
                  Connexion
                </Link>
                <Link href="/register" className="header__button header__button--secondary">
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

