import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/event.service';
import { Calendar, MapPin, Users, Clock, Plus, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startDate: string;
  endDate: string;
  type: string;
  creator: { id: string; firstName: string; lastName: string };
  participants: { user: { id: string; firstName: string; lastName: string } }[];
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>({});

  useEffect(() => {
    // Récupérer l'utilisateur depuis localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    } catch {
      setUser({});
    }
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getAll();
      setEvents(data);

      // Récupérer les événements où l'utilisateur est inscrit
      const reg = new Set<string>();
      for (const ev of data) {
        if (ev.participants.some((p: any) => p.user?.id === user.id)) {
          reg.add(ev.id);
        }
      }
      setRegisteredEvents(reg);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.id) {
      loadEvents();
    }
  }, [user.id]);

  const handleRegister = async (eventId: string) => {
    try {
      await eventService.register(eventId);
      setRegisteredEvents(prev => new Set(prev).add(eventId));
      await loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await eventService.unregister(eventId);
      setRegisteredEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
      await loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la désinscription');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Supprimer définitivement cet événement ?')) return;
    try {
      await eventService.delete(eventId);
      await loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr });
  };

  const isAdmin = user.role === 'Super Admin' || user.role === 'Responsable';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <div className="flex items-center gap-3 text-church-navy">
          <Loader2 className="animate-spin" size={28} />
          <span className="text-xl">Chargement des événements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-church-gold/10 rounded-full">
              <Calendar className="text-church-gold" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-church-navy">Événements</h1>
              <p className="text-gray-500">Cultes, réunions, camps et conférences</p>
            </div>
          </div>
          {isAdmin && (
            <Link
              to="/events/create"
              className="flex items-center gap-2 bg-church-gold text-white px-5 py-2.5 rounded-lg hover:bg-church-gold/80 transition shadow-md"
            >
              <Plus size={20} /> Créer un événement
            </Link>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        {/* Liste des événements */}
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="mx-auto text-gray-300" size={64} />
            <p className="text-gray-500 mt-4 text-lg">Aucun événement à venir.</p>
            {isAdmin && (
              <Link
                to="/events/create"
                className="inline-block mt-4 text-church-gold hover:underline"
              >
                Créer le premier événement →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => {
              const isRegistered = registeredEvents.has(event.id);
              const isCreator = event.creator?.id === user.id;
              const participantCount = event.participants?.length || 0;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition"
                >
                  {/* Bandeau type */}
                  <div className={`px-4 py-1 text-xs font-medium text-white ${
                    event.type === 'culte' ? 'bg-church-navy' :
                    event.type === 'camp' ? 'bg-green-600' :
                    event.type === 'conference' ? 'bg-purple-600' :
                    event.type === 'reunion' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}>
                    {event.type?.toUpperCase() || 'ÉVÉNEMENT'}
                  </div>

                  <div className="p-5">
                    {/* Titre */}
                    <h2 className="text-xl font-bold text-church-navy mb-2">{event.title}</h2>

                    {/* Description */}
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Infos */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{formatDate(event.startDate)}</span>
                        {event.endDate && (
                          <>
                            <span className="text-gray-300">→</span>
                            <span>{format(parseISO(event.endDate), 'HH:mm')}</span>
                          </>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span>
                          {participantCount} participant{participantCount > 1 ? 's' : ''}
                          {event.creator && (
                            <span className="text-gray-400 ml-2">
                              • Organisé par {event.creator.firstName} {event.creator.lastName}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      {isRegistered ? (
                        <button
                          onClick={() => handleUnregister(event.id)}
                          className="flex items-center gap-1 px-4 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                        >
                          <X size={16} /> Se désinscrire
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(event.id)}
                          className="flex items-center gap-1 px-4 py-1.5 bg-church-gold text-white rounded-lg hover:bg-church-gold/80 transition text-sm"
                        >
                          <Check size={16} /> S'inscrire
                        </button>
                      )}

                      {isRegistered && (
                        <span className="text-xs text-green-600 font-medium ml-1">✅ Inscrit</span>
                      )}

                      {(isAdmin || isCreator) && (
                        <div className="flex gap-1 ml-auto">
                          <Link
                            to={`/events/edit/${event.id}`}
                            className="p-1.5 text-gray-400 hover:text-church-navy transition"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}