import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readingPlanService } from '../services/reading-plan.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Calendar, CheckCircle, ArrowLeft, User, RefreshCw, Trash2 } from 'lucide-react';

interface ReadingPlanDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  verses: string[];
  totalItems: number;
  isActive: boolean;
  user: { id: string; firstName: string; lastName: string };
  progress: { id: string; currentIndex: number; completedAt: string | null; lastReadAt: string | null }[];
  _count: { progress: number };
  createdAt: string;
}

export default function ReadingPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<ReadingPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [reading, setReading] = useState<{ verse: string; progress: any; isCompleted: boolean; total: number; remaining: number } | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadPlan = async () => {
    if (!id) return;
    try {
      const data = await readingPlanService.getOne(id);
      setPlan(data);
    } catch (err) {
      setError('Plan introuvable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [id]);

  const handleReadNext = async () => {
    if (!id) return;
    try {
      const result = await readingPlanService.readNext(id);
      setReading(result);
      loadPlan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleReset = async () => {
    if (!id || !confirm('Réinitialiser votre progression sur ce plan ?')) return;
    try {
      await readingPlanService.reset(id);
      setReading(null);
      loadPlan();
    } catch (err) {
      alert('Erreur');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Supprimer ce plan ?')) return;
    try {
      await readingPlanService.delete(id);
      navigate('/reading-plans');
    } catch (err) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-church-gold" size={40} /></div>;
  if (error || !plan) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Introuvable'}</div>;

  const userProgress = plan.progress[0];
  const progressPercent = userProgress ? Math.round((userProgress.currentIndex / plan.totalItems) * 100) : 0;
  const isCompleted = userProgress?.completedAt !== null;
  const isCreator = user?.id === plan.user.id;
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Responsable';

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/reading-plans')} className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4">
          <ArrowLeft size={20} /> Retour
        </button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-church-gold/10 text-church-gold px-2 py-0.5 rounded-full">{plan.type}</span>
                  <span className="text-xs text-gray-400">{plan.frequency}</span>
                  <span className="text-xs text-gray-400">{plan.totalItems} versets</span>
                </div>
                <CardTitle className="text-2xl text-church-navy">{plan.title}</CardTitle>
                {plan.description && <p className="text-gray-600 mt-2">{plan.description}</p>}
              </div>
              {(isCreator || isAdmin) && (
                <Button onClick={handleDelete} variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progression */}
            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progression</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-church-gold h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              {userProgress && (
                <p className="text-xs text-gray-400 mt-1">
                  {userProgress.currentIndex} / {plan.totalItems} versets lus
                  {isCompleted && <span className="ml-2 text-green-600">✅ Complété</span>}
                </p>
              )}
            </div>

            {/* Verset du jour / Lecture */}
            {reading && (
              <div className="bg-church-cream p-4 rounded-lg border border-church-gold/20">
                <p className="text-xs text-gray-500 mb-1">📖 Lecture du jour</p>
                <p className="text-lg italic text-church-navy">"{reading.verse}"</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Progression : {reading.progress.currentIndex} / {reading.total}</span>
                  <span>Restant : {reading.remaining}</span>
                  {reading.isCompleted && <span className="text-green-600">✅ Plan terminé</span>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleReadNext} className="bg-church-gold hover:bg-church-gold/80 text-white">
                <BookOpen size={18} className="mr-2" /> Lire le verset suivant
              </Button>
              {userProgress && userProgress.currentIndex > 0 && (
                <Button onClick={handleReset} variant="outline" className="border-orange-200 text-orange-500 hover:bg-orange-50">
                  <RefreshCw size={18} className="mr-2" /> Réinitialiser
                </Button>
              )}
            </div>

            {/* Détails */}
            <div className="border-t pt-4 text-sm text-gray-500">
              <p>👤 Créé par {plan.user.firstName} {plan.user.lastName}</p>
              <p>📅 {new Date(plan.createdAt).toLocaleDateString()}</p>
              <p>👥 {plan._count.progress} participants</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}