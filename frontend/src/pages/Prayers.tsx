import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { prayerService } from '../services/prayer.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart, MessageCircle, Plus, CheckCircle, Clock, User } from 'lucide-react';

interface Prayer {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  user: { id: string; firstName: string; lastName: string; photoUrl?: string };
  _count: { comments: number; reactions: number };
  createdAt: string;
}

export default function Prayers() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadPrayers = async () => {
    try {
      const data = await prayerService.getAll();
      setPrayers(data);
    } catch (err) {
      setError('Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrayers();
  }, []);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' à ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="animate-spin text-church-gold" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-church-navy flex items-center gap-3">
              <Heart className="text-church-gold" size={28} /> Demandes de prière
            </h1>
            <p className="text-sm md:text-base text-gray-500">Partage tes besoins et soutiens les autres</p>
          </div>
          <Link to="/prayers/create">
            <Button className="bg-church-gold hover:bg-church-gold/80 text-white">
              <Plus size={18} className="mr-2" /> Nouvelle demande
            </Button>
          </Link>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {prayers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Heart className="mx-auto text-gray-300" size={64} />
            <p className="text-gray-500 mt-4 text-lg">Aucune demande de prière pour le moment.</p>
            <Link to="/prayers/create" className="inline-block mt-4 text-church-gold hover:underline">
              Partager ta première demande →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {prayers.map((prayer) => (
              <Link to={`/prayers/${prayer.id}`} key={prayer.id} className="block">
                <Card className="hover:shadow-lg transition border border-gray-100">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {prayer.user.photoUrl ? (
                            <img src={prayer.user.photoUrl} alt="Photo" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                              {prayer.user.firstName[0]}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">{prayer.user.firstName} {prayer.user.lastName}</span>
                          <span className="text-xs text-gray-400">• {formatDate(prayer.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-church-navy">{prayer.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{prayer.content}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {prayer.isAnswered ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle size={14} /> Exaucée
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-500 text-xs bg-orange-50 px-2 py-1 rounded-full">
                            <Clock size={14} /> En cours
                          </span>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Heart size={14} className="text-red-400" /> {prayer._count.reactions}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={14} /> {prayer._count.comments}
                          </span>
                        </div>
                      </div>
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