import { useEffect, useState } from 'react';
import { gameService } from '../services/game.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Star, Calendar, User } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  totalScore: number;
  totalGames: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await gameService.getLeaderboard(month, year);
      setEntries(data.leaderboard);
    } catch (err) {
      setError('Impossible de charger le classement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [month, year]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-church-gold" size={32} />
          <h1 className="text-3xl font-bold text-church-navy">Classement du mois</h1>
        </div>

        {/* Sélecteur de mois */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
              className="w-14 p-1 border rounded text-center"
            />
            <span className="text-gray-500">/</span>
            <input
              type="number"
              min="2020"
              max={new Date().getFullYear()}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-20 p-1 border rounded text-center"
            />
          </div>
          <button
            onClick={() => {
              const now = new Date();
              setMonth(now.getMonth() + 1);
              setYear(now.getFullYear());
            }}
            className="px-3 py-1 bg-church-gold/10 text-church-gold rounded hover:bg-church-gold/20 transition"
          >
            Mois en cours
          </button>
          <span className="text-sm text-gray-400 ml-auto">
            {entries.length} participants
          </span>
        </div>

        {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
        {error && <div className="text-center py-8 text-red-500">{error}</div>}

        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun score enregistré ce mois-ci.</div>
        )}

        <div className="space-y-3">
          {entries.map((entry, index) => {
            const isTop3 = index < 3;
            return (
              <Card key={entry.userId} className={`border-l-4 ${isTop3 ? 'border-church-gold' : 'border-gray-200'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400 w-8 text-center">
                      {isTop3 ? medals[index] : `#${index + 1}`}
                    </span>
                    <div>
                      <p className="font-semibold text-church-navy">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <User size={14} /> {entry.totalGames} partie{entry.totalGames > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="text-church-gold" size={18} />
                    <span className="text-xl font-bold text-church-navy">{entry.totalScore}</span>
                    <span className="text-sm text-gray-400">pts</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}