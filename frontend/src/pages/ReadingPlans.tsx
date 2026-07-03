import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readingPlanService } from '../services/reading-plan.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Calendar, CheckCircle, Clock, Plus, User, Users, Target } from 'lucide-react';

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  totalItems: number;
  isActive: boolean;
  user: { firstName: string; lastName: string };
  _count: { progress: number };
  createdAt: string;
}

export default function ReadingPlans() {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [verseOfDay, setVerseOfDay] = useState<{ verse: string; reference: string } | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, statsData, verseData] = await Promise.all([
        readingPlanService.getAll(),
        readingPlanService.getStats(),
        readingPlanService.getVerseOfTheDay(),
      ]);
      setPlans(plansData);
      setStats(statsData);
      setVerseOfDay(verseData);
    } catch (err) {
      setError('Impossible de charger les plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-church-navy flex items-center gap-3">
              <BookOpen className="text-church-gold" size={28} /> Plans de lecture
            </h1>
            <p className="text-sm md:text-base text-gray-500">Grandis dans la Parole chaque jour</p>
          </div>
          {(user?.role === 'Super Admin' || user?.role === 'Responsable') && (
            <Link to="/reading-plans/create">
              <Button className="bg-church-gold hover:bg-church-gold/80 text-white">
                <Plus size={18} className="mr-2" /> Créer un plan
              </Button>
            </Link>
          )}
        </div>

        {/* Verset du jour */}
        {verseOfDay && (
          <Card className="bg-gradient-to-r from-church-gold/10 to-church-navy/10 border-church-gold mb-6">
            <CardContent className="p-4 md:p-6">
              <p className="text-xs text-gray-500 mb-1">📖 Verset du jour</p>
              <p className="text-lg italic text-church-navy">"{verseOfDay.verse}"</p>
              <p className="text-sm text-gray-500 mt-1">{verseOfDay.reference}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-church-navy">{stats.totalPlans}</p>
                <p className="text-sm text-gray-500">Plans entrepris</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completedPlans}</p>
                <p className="text-sm text-gray-500">Plans complétés</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-church-gold">{stats.totalVersesRead}</p>
                <p className="text-sm text-gray-500">Versets lus</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.hasReadToday ? '✅' : '⏳'}
                </p>
                <p className="text-sm text-gray-500">Lecture du jour</p>
              </CardContent>
            </Card>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {plans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="mx-auto text-gray-300" size={64} />
            <p className="text-gray-500 mt-4 text-lg">Aucun plan de lecture disponible.</p>
            {(user?.role === 'Super Admin' || user?.role === 'Responsable') && (
              <Link to="/reading-plans/create" className="inline-block mt-4 text-church-gold hover:underline">
                Créer le premier plan →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Link to={`/reading-plans/${plan.id}`} key={plan.id} className="block group">
                <Card className="h-full hover:shadow-lg transition border border-gray-100">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-church-gold/10 rounded-full">
                          {plan.type === 'daily' ? <Calendar size={18} className="text-church-gold" /> : <Target size={18} className="text-church-gold" />}
                        </div>
                        <span className="text-xs text-gray-400">{plan.frequency}</span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {plan.totalItems} versets
                      </span>
                    </div>
                    <CardTitle className="text-church-navy text-lg group-hover:text-church-gold transition line-clamp-1">
                      {plan.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {plan.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {plan.user.firstName} {plan.user.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {plan._count.progress} participants
                      </span>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full border-church-gold text-church-gold hover:bg-church-gold/10">
                        Commencer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}