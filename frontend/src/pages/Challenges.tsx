import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challenge.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Target, CheckCircle, Clock, BookOpen, Heart, Users, RefreshCw, Filter } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  points: number;
  category: string;
  isActive: boolean;
  _count: { participations: number };
}

interface ChallengeParticipation {
  id: string;
  challengeId: string;
  completedAt: string | null;
  challenge: Challenge;
}

export default function Challenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterFrequency, setFilterFrequency] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [challengesData, statsData] = await Promise.all([
        challengeService.getAll(),
        challengeService.getStats(),
      ]);
      setChallenges(challengesData);
      setParticipations(statsData?.recentParticipations || []);
    } catch (err) {
      setError('Impossible de charger les défis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleParticipate = async (id: string) => {
    try {
      await challengeService.participate(id);
      loadData();
    } catch (err) {
      alert('Erreur');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await challengeService.complete(id);
      loadData();
    } catch (err) {
      alert('Erreur');
    }
  };

  // Filtrer les défis
  const filteredChallenges = challenges.filter(c => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterFrequency && c.frequency !== filterFrequency) return false;
    return true;
  });

  // Vérifier si l'utilisateur a déjà complété un défi
  const isCompleted = (challengeId: string) => {
    return participations.some(p => p.challengeId === challengeId && p.completedAt !== null);
  };

  const isParticipating = (challengeId: string) => {
    return participations.some(p => p.challengeId === challengeId);
  };

  // Statistiques
  const totalCompleted = participations.filter(p => p.completedAt !== null).length;
  const totalPoints = participations
    .filter(p => p.completedAt !== null)
    .reduce((acc, p) => acc + (p.challenge?.points || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="animate-spin text-church-gold" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-church-navy flex items-center gap-3">
              <Target className="text-church-gold" size={28} /> Défis spirituels
            </h1>
            <p className="text-sm md:text-base text-gray-500">Grandis chaque jour en relevant des défis</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData} className="border-church-gold text-church-gold">
              <RefreshCw size={16} className="mr-2" /> Rafraîchir
            </Button>
          </div>
        </div>

        {/* Statistiques personnelles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-church-navy">{participations.length}</p>
              <p className="text-sm text-gray-500">Défis entrepris</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
              <p className="text-sm text-gray-500">Défis complétés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-church-gold">{totalPoints}</p>
              <p className="text-sm text-gray-500">Points accumulés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {participations.some(p => p.completedAt && new Date(p.completedAt).toDateString() === new Date().toDateString()) ? '✅' : '⏳'}
              </p>
              <p className="text-sm text-gray-500">Défi du jour</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter size={18} />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border border-gray-200 rounded-lg bg-white text-sm"
          >
            <option value="">Toutes les catégories</option>
            <option value="lecture">📖 Lecture</option>
            <option value="priere">🙏 Prière</option>
            <option value="encouragement">💬 Encouragement</option>
            <option value="service">🤝 Service</option>
            <option value="étude">📚 Étude</option>
          </select>
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="p-2 border border-gray-200 rounded-lg bg-white text-sm"
          >
            <option value="">Toutes les fréquences</option>
            <option value="daily">📅 Quotidien</option>
            <option value="weekly">📆 Hebdomadaire</option>
          </select>
          {(filterCategory || filterFrequency) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterFrequency(''); }}
              className="text-xs text-red-500 hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {/* Liste des défis */}
        {filteredChallenges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Target className="mx-auto text-gray-300" size={64} />
            <p className="text-gray-500 mt-4 text-lg">Aucun défi disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => {
              const completed = isCompleted(challenge.id);
              const participating = isParticipating(challenge.id);

              return (
                <Card key={challenge.id} className="hover:shadow-lg transition border border-gray-100">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-church-gold/10 rounded-full">
                          <Target className="text-church-gold" size={18} />
                        </div>
                        <span className="text-xs text-gray-400">{challenge.frequency}</span>
                        {challenge.category && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{challenge.category}</span>
                        )}
                      </div>
                      <span className="text-xs bg-church-gold/10 text-church-gold px-2 py-0.5 rounded-full">
                        +{challenge.points} pts
                      </span>
                    </div>
                    <CardTitle className="text-church-navy text-lg line-clamp-1">{challenge.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-gray-400">{challenge._count.participations} participants</span>
                      <div className="flex gap-2">
                        {!participating && !completed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleParticipate(challenge.id)}
                            className="text-church-gold border-church-gold"
                          >
                            Participer
                          </Button>
                        )}
                        {participating && !completed && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(challenge.id)}
                            className="bg-church-gold text-white"
                          >
                            <CheckCircle size={14} className="mr-1" /> Compléter
                          </Button>
                        )}
                        {completed && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle size={14} /> Complété
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}