'use client';

import { FaTrophy, FaMedal, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  wins: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/scores/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="text-yellow-500 text-2xl" />;
      case 2:
        return <FaMedal className="text-gray-400 text-2xl" />;
      case 3:
        return <FaMedal className="text-amber-600 text-2xl" />;
      default:
        return <span className="text-lg font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/dashboard" className="btn btn-ghost mb-6">
          <FaArrowLeft /> Retour au Dashboard
        </Link>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl mb-4">
              <FaTrophy className="text-yellow-500" /> Classement
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-base-content/50">
                <FaTrophy className="text-6xl mx-auto mb-4 opacity-20" />
                <p className="text-xl">Aucun score enregistré pour le moment</p>
                <p className="mt-2">Soyez le premier à jouer !</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Rang</th>
                      <th>Joueur</th>
                      <th>Score total</th>
                      <th>Parties</th>
                      <th>Victoires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.rank} className={entry.rank <= 3 ? 'font-bold' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td>{entry.username}</td>
                        <td>
                          <span className="badge badge-primary badge-lg">
                            {entry.totalScore}
                          </span>
                        </td>
                        <td>{entry.gamesPlayed}</td>
                        <td>
                          <span className="badge badge-success">
                            {entry.wins}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
