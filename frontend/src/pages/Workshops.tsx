import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workshopService } from '../services/workshop.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Mic,
  Music,
  Film,
  BookOpen,
  Heart,
  UserPlus,
  UserMinus,
  Loader2,
  Plus,
  Check,
  X,
  Clock,
  Home,
} from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  leader: { id: string; firstName: string; lastName: string };
  members: { user: { id: string; firstName: string; lastName: string }; status: string }[];
  _count: { members: number };
}

const categoryIcons: Record<string, any> = {
  Chorale: Music,
  Danse: Music,
  Média: Film,
  Évangélisation: BookOpen,
  Intercession: Heart,
  Prière: Heart,
  'Étude biblique': BookOpen,
  Jeunesse: Users,
  Femmes: Users,
  Hommes: Users,
};

export default function Workshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>({ id: null });
  const [memberStatus, setMemberStatus] = useState<Record<string, string>>({});
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadWorkshops = async () => {
    if (!user.id) return;
    try {
      const data = await workshopService.getAll();
      setWorkshops(data);
      const statusMap: Record<string, string> = {};
      for (const ws of data) {
        const membership = ws.members.find((m: any) => m.user.id === user.id);
        if (membership) {
          statusMap[ws.id] = membership.status;
        } else {
          statusMap[ws.id] = 'none';
        }
      }
      setMemberStatus(statusMap);
    } catch (err) {
      setError('Impossible de charger les ateliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.id) {
      loadWorkshops();
    }
  }, [user.id]);

  const handleJoin = async (workshopId: string) => {
    setJoining(workshopId);
    try {
      await workshopService.join(workshopId);
      setMemberStatus((prev) => ({ ...prev, [workshopId]: 'pending' }));
    } catch (err) {
      alert('Erreur lors de la demande');
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (workshopId: string) => {
    if (!confirm('Quitter cet atelier ?')) return;
    try {
      await workshopService.leave(workshopId);
      setMemberStatus((prev) => ({ ...prev, [workshopId]: 'none' }));
      loadWorkshops();
    } catch (err) {
      alert('Erreur lors du départ');
    }
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
      <div className="max-w-6xl mx-auto">
        {/* En-tête avec bouton Menu principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-church-navy flex items-center gap-3">
              <Users className="text-church-gold" size={28} /> Ateliers
            </h1>
            <p className="text-sm md:text-base text-gray-500">Rejoins un groupe pour servir et grandir</p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'Super Admin' && (
              <Link to="/workshops/create">
                <Button className="bg-church-gold hover:bg-church-gold/80 text-white">
                  <Plus size={18} className="mr-2" /> Créer
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="outline" className="text-church-navy border-church-gold hover:bg-church-gold/10">
                <Home size={18} className="mr-2" /> Menu
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {workshops.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="mx-auto text-gray-300" size={64} />
            <p className="text-gray-500 mt-4 text-lg">Aucun atelier disponible pour le moment.</p>
            {user?.role === 'Super Admin' && (
              <Link to="/workshops/create" className="inline-block mt-4 text-church-gold hover:underline">
                Créer le premier atelier →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((ws) => {
              const Icon = categoryIcons[ws.category] || Users;
              const status = memberStatus[ws.id] || 'none';
              const isLeader = user.id === ws.leader.id;

              return (
                <Card key={ws.id} className="hover:shadow-lg transition border border-gray-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-church-gold/10 rounded-full">
                          <Icon className="text-church-gold" size={20} />
                        </div>
                        <div>
                          <CardTitle className="text-church-navy text-lg">
                            <Link to={`/workshops/${ws.id}`} className="hover:text-church-gold transition">
                              {ws.name}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-xs font-medium text-gray-400">
                            {ws.category}
                          </CardDescription>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {ws._count.members} membres
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {ws.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ws.description}</p>
                    )}
                    <p className="text-xs text-gray-400">👤 {ws.leader.firstName} {ws.leader.lastName}</p>
                    <div className="mt-3 flex items-center flex-wrap gap-2">
                      {status === 'none' && (
                        <button
                          onClick={() => handleJoin(ws.id)}
                          disabled={joining === ws.id}
                          className="text-xs flex items-center gap-1 text-church-gold hover:underline"
                        >
                          {joining === ws.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <UserPlus size={14} />
                          )}{' '}
                          Rejoindre
                        </button>
                      )}
                      {status === 'pending' && (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <Clock size={14} /> En attente
                        </span>
                      )}
                      {status === 'approved' && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check size={14} /> Membre
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <X size={14} /> Refusé
                        </span>
                      )}
                      {(status === 'approved' || status === 'pending') && (
                        <button
                          onClick={() => handleLeave(ws.id)}
                          className="text-xs text-red-400 hover:text-red-600 ml-auto"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
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