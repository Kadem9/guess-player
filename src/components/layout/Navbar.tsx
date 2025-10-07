'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { 
  FaHome, 
  FaSignInAlt, 
  FaUserPlus, 
  FaUser, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon,
  FaTrophy,
  FaGamepad
} from 'react-icons/fa';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li><Link href="/" onClick={() => setIsMenuOpen(false)}><FaHome /> Accueil</Link></li>
            {user ? (
              <>
                <li><Link href="/dashboard" onClick={() => setIsMenuOpen(false)}><FaGamepad /> Dashboard</Link></li>
                <li><Link href="/leaderboard" onClick={() => setIsMenuOpen(false)}><FaTrophy /> Classement</Link></li>
                <li><button onClick={handleLogout}><FaSignOutAlt /> Déconnexion</button></li>
              </>
            ) : (
              <>
                <li><Link href="/login" onClick={() => setIsMenuOpen(false)}><FaSignInAlt /> Connexion</Link></li>
                <li><Link href="/register" onClick={() => setIsMenuOpen(false)}><FaUserPlus /> Inscription</Link></li>
              </>
            )}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-bold">
          Guess Player
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/" className="flex items-center gap-2"><FaHome /> Accueil</Link></li>
          {user && (
            <>
              <li><Link href="/dashboard" className="flex items-center gap-2"><FaGamepad /> Dashboard</Link></li>
              <li><Link href="/leaderboard" className="flex items-center gap-2"><FaTrophy /> Classement</Link></li>
            </>
          )}
        </ul>
      </div>

      <div className="navbar-end">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <FaUser />
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li className="px-4 py-2 text-sm text-base-content/70">
                  {user.prenom} {user.nom}
                </li>
                <li className="px-4 py-2 text-xs text-base-content/50">
                  @{user.username}
                </li>
                <div className="divider my-1"></div>
                <li><Link href="/dashboard"><FaGamepad /> Dashboard</Link></li>
                <li><Link href="/leaderboard"><FaTrophy /> Classement</Link></li>
                <div className="divider my-1"></div>
                <li><button onClick={handleLogout} className="text-error"><FaSignOutAlt /> Déconnexion</button></li>
              </ul>
            </div>
          ) : (
            <div className="hidden sm:flex gap-2">
              <Link href="/login" className="btn btn-primary btn-sm">
                <FaSignInAlt /> Connexion
              </Link>
              <Link href="/register" className="btn btn-outline btn-sm">
                <FaUserPlus /> Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
