import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/stats.service';
import { challengeService } from '../services/challenge.service';
import { chatService } from '../services/chat.service';
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  Users,
  BookOpen,
  Heart,
  Sparkles,
  Gamepad2,
  Target,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [user, setUser] = useState<any>({});
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [todayChallenge, setTodayChallenge] = useState<any>(null);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Charger l'utilisateur depuis localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setLoading(false);

    // Charger les stats
    const loadStats = async () => {
      try {
        const data = await statsService.getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Erreur stats:', err);
        setStats({ members: 0, workshops: 0, prayers: 0, upcomingEvents: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();

    // Charger le défi du jour
    const loadTodayChallenge = async () => {
      try {
        const data = await challengeService.getToday();
        setTodayChallenge(data);
      } catch (err) {
        console.error('Erreur défi du jour:', err);
        setTodayChallenge(null);
      } finally {
        setChallengeLoading(false);
      }
    };
    loadTodayChallenge();

    // Charger le nombre de messages non lus
    const loadUnread = async () => {
      try {
        const data = await chatService.getUnreadCount();
        setUnreadCount(data.unread || 0);
      } catch (err) {
        console.error('Erreur chargement messages non lus:', err);
      }
    };
    loadUnread();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  // ✅ Gestion robuste du rôle (peut être chaîne ou objet)
  const roleDisplay = user?.role?.name || user?.role || 'Non défini';
  const isSuperAdmin = user?.role === 'Super Admin' || user?.role?.name === 'Super Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Bannière de débogage (à retirer plus tard) */}
        <div className={`p-2 mb-4 text-center text-sm font-bold rounded-lg ${isSuperAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Rôle : <strong>{roleDisplay}</strong> {isSuperAdmin ? '✅ Super Admin' : '❌ Pas Super Admin'}
        </div>

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-church-navy to-church-gold flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-church-navy">
                Bonjour, {user?.firstName || 'Invité'} {user?.lastName || ''}
              </h1>
              <p className="text-gray-500 flex items-center gap-1">
                <Shield size={14} /> {roleDisplay}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-church-navy/10 rounded-full"><Users className="text-church-navy" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Membres</p>
              <p className="text-xl font-bold">{statsLoading ? '...' : stats?.members || 0}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-church-gold/10 rounded-full"><BookOpen className="text-church-gold" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Ateliers</p>
              <p className="text-xl font-bold">{statsLoading ? '...' : stats?.workshops || 0}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full"><Heart className="text-green-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Prières</p>
              <p className="text-xl font-bold">{statsLoading ? '...' : stats?.prayers || 0}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full"><Calendar className="text-purple-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Événements</p>
              <p className="text-xl font-bold">{statsLoading ? '...' : stats?.upcomingEvents || 0}</p>
            </div>
          </div>
        </div>

        {/* 🎯 DÉFI DU JOUR (WIDGET) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="text-church-gold" size={20} />
              <h2 className="text-sm sm:text-base font-semibold text-church-navy">🎯 Défi du jour</h2>
            </div>
            <Link to="/challenges" className="text-xs text-church-gold hover:underline">Voir tous les défis</Link>
          </div>
          <div className="p-4 sm:p-5">
            {challengeLoading ? (
              <p className="text-gray-400 text-sm">Chargement...</p>
            ) : todayChallenge?.challenge ? (
              <div>
                <h3 className="font-semibold text-church-navy">{todayChallenge.challenge.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{todayChallenge.challenge.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">🏆 {todayChallenge.challenge.points} pts</span>
                  {todayChallenge.completed ? (
                    <span className="text-xs text-green-600">✅ Défi complété aujourd'hui</span>
                  ) : (
                    <Link to={`/challenges/${todayChallenge.challenge.id}`}>
                      <Button className="bg-church-gold hover:bg-church-gold/80 text-white text-xs py-1 px-3 h-auto">
                        Relever le défi
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">📌 Aucun défi disponible aujourd'hui. Reviens plus tard !</p>
            )}
          </div>
        </div>

        {/* Profil */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <User size={20} className="text-church-navy" />
            <h2 className="text-lg font-semibold text-church-navy">Informations personnelles</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Membre depuis</p>
                <p className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Rôle</p>
                <p className="font-medium">{roleDisplay}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {user?.isActive ? '✅ Compte actif' : '⏳ En attente de validation'}
              </span>
            </div>
          </div>
        </div>

        {/* Accès rapides */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Fil d'actualité */}
          <Link to="/feed" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-church-gold/10 rounded-full group-hover:bg-church-gold/20 transition"><BookOpen className="text-church-gold" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Fil d'actualité</p><p className="text-sm text-gray-500">Partager, commenter, aimer</p></div>
          </Link>

          {/* Assistant IA */}
          <Link to="/ia" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-full group-hover:bg-purple-100 transition"><Sparkles className="text-purple-600" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Assistant IA</p><p className="text-sm text-gray-500">Pose ta question</p></div>
          </Link>

          {/* Événements */}
          <Link to="/events" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition"><Calendar className="text-green-600" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Événements</p><p className="text-sm text-gray-500">Cultes, réunions, camps</p></div>
          </Link>

          {/* Jeux */}
          <Link to="/games" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-church-gold/10 rounded-full group-hover:bg-church-gold/20 transition"><Gamepad2 className="text-church-gold" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Jeux bibliques</p><p className="text-sm text-gray-500">Apprends en t'amusant</p></div>
          </Link>

          {/* Ateliers */}
          <Link to="/workshops" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-church-gold/10 rounded-full group-hover:bg-church-gold/20 transition"><Users className="text-church-gold" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Ateliers</p><p className="text-sm text-gray-500">Rejoins un groupe</p></div>
          </Link>

          {/* Demandes de prière */}
          <Link to="/prayers" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full group-hover:bg-red-100 transition"><Heart className="text-red-500" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Demandes de prière</p><p className="text-sm text-gray-500">Partage et soutien</p></div>
          </Link>

          {/* Bibliothèque */}
          <Link to="/library" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition"><BookOpen className="text-blue-500" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Bibliothèque</p><p className="text-sm text-gray-500">Enseignements et ressources</p></div>
          </Link>

          {/* Défis spirituels */}
          <Link to="/challenges" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition"><Target className="text-green-500" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Défis spirituels</p><p className="text-sm text-gray-500">Grandis chaque jour</p></div>
          </Link>

          {/* Messages (NOUVEAU) */}
          <Link to="/chat" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4 relative">
            <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition">
              <MessageCircle className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="font-semibold text-church-navy">Messages</p>
              <p className="text-sm text-gray-500">Discute avec les membres</p>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Administration */}
          {isSuperAdmin && (
            <Link to="/admin" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
              <div className="p-3 bg-church-navy/10 rounded-full group-hover:bg-church-navy/20 transition"><Shield className="text-church-navy" size={24} /></div>
              <div><p className="font-semibold text-church-navy">Administration</p><p className="text-sm text-gray-500">Gérer les membres</p></div>
            </Link>
          )}

          {/* Statistiques */}
          {isSuperAdmin && (
            <Link to="/stats" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition"><BarChart3 className="text-indigo-500" size={24} /></div>
              <div><p className="font-semibold text-church-navy">Statistiques</p><p className="text-sm text-gray-500">Vue d'ensemble</p></div>
            </Link>
          )}

          {/* Profil */}
          <Link to="/profile" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition"><User className="text-blue-600" size={24} /></div>
            <div><p className="font-semibold text-church-navy">Mon profil</p><p className="text-sm text-gray-500">Modifier mes informations</p></div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">Ecclesia Connect v1.0 • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}