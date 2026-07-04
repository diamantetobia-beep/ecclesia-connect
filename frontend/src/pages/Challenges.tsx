import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challenge.service';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Target, CheckCircle, Clock, RefreshCw, Filter, Plus } from 'lucide-react';

// Types
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  points: number;
  category: string | null;
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
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterFrequency, setFilterFrequency] = useState<string>('');

  // ========== DÉBOGAGE ==========
  console.log('🔍 [DEBUG] user complet :', user);
  console.log('🔍 [DEBUG] user.role :', user?.role);
  console.log('🔍 [DEBUG] user.role?.name :', user?.role?.name);
  console.log('🔍 [DEBUG] typeof user.role :', typeof user?.role);
  console.log('🔍 [DEBUG] user.role (stringifié) :', JSON.stringify(user?.role, null, 2));
  // ===============================

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [challengesData, statsData, todayData] = await Promise.all([
        challengeService.getAll(),
        challengeService.getStats(),
        challengeService.getToday(),
      ]);

      setChallenges(Array.isArray(challengesData) ? challengesData : []);
      setParticipations(Array.isArray(statsData?.recentParticipations) ? statsData.recentParticipations : []);
      setTodayChallenge(todayData || null);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les défis. Veuillez réessayer.');
      setChallenges([]);
      setParticipations([]);
      setTodayChallenge(null);
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
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la participation');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await challengeService.complete(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la validation du défi');
    }
  };

  // Filtrage
  const filteredChallenges = challenges.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterFrequency && c.frequency !== filterFrequency) return false;
    return true;
  });

  const isCompleted = (challengeId: string) =>
    participations.some((p) => p.challengeId === challengeId && p.completedAt !== null);

  const isParticipating = (challengeId: string) =>
    participations.some((p) => p.challengeId === challengeId);

  const totalCompleted = participations.filter((p) => p.completedAt !== null).length;
  const totalPoints = participations
    .filter((p) => p.completedAt !== null)
    .reduce((acc, p) => acc + (p.challenge?.points || 0), 0);

  // ========== DÉTECTION ROBUSTE DU RÔLE SUPER ADMIN ==========
  // Cette fonction gère plusieurs structures possibles :
  // - user.role = "Super Admin" (chaîne)
  // - user.role = { name: "Super Admin" } (objet)
  // - user.role = { role: "Super Admin" } (objet avec autre clé)
  // - user.roleId = "id_superadmin" (si on utilise un ID)
  const isSuperAdmin = (() => {
    if (!user) return false;

    // 1. Si user.role est une chaîne
    if (typeof user.role === 'string') {
      const normalized = user.role.toLowerCase().replace(/\s/g, '');
      return normalized === 'superadmin';
    }

    // 2. Si user.role est un objet
    if (user.role && typeof user.role === 'object') {
      // Cherche le nom du rôle dans différentes propriétés possibles
      const roleName = user.role.name || user.role.role || user.role.roleName || '';
      if (roleName) {
        const normalized = roleName.toLowerCase().replace(/\s/g, '');
        return normalized === 'superadmin';
      }
    }

    // 3. Si on a un roleId (ex: "role_superadmin")
    if (user.roleId) {
      // Tu peux comparer avec l'ID exact du rôle superadmin dans ta base
      // return user.roleId === 'role_superadmin_id';
      // Pour l'instant, on ignore ce cas, mais tu peux l'ajouter
    }

    return false;
  })();

  // ========== AFFICHAGE DU STATUT DÉBOGAGE ==========
  console.log('🔍 [DEBUG] isSuperAdmin =', isSuperAdmin);
  // ===================================================

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
            <p className="text-sm md:text-base text-gray-500">
              Grandis chaque jour en relevant des défis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button
                onClick={() => navigate('/challenges/create')}
                className="bg-church-gold text-white hover:bg-church-gold/90"
              >
                <Plus size={16} className="mr-2" /> Créer un défi
              </Button>
            )}
            <Button
              variant="outline"
              onClick={loadData}
              className="border-church-gold text-church-gold"
            >
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
                {participations.some(
                  (p) =>
                    p.completedAt &&
                    new Date(p.completedAt).toDateString() === new Date().toDateString()
                )
                  ? '✅'
                  : '⏳'}
              </p>
              <p className="text-sm text-gray-500">Défi du jour</p>
            </CardContent>
          </Card>
        </div>

        {/* Défi du jour */}
        {todayChallenge && (
          <Card className="mb-6 border-2 border-church-gold/30 bg-gradient-to-r from-church-gold/5 to-white">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-church-gold/20 rounded-full">
                  <Clock className="text-church-gold" size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-church-gold font-semibold">
                    Défi du jour
                  </p>
                  <h3 className="font-bold text-church-navy">{todayChallenge.title}</h3>
                  <p className="text-sm text-gray-600">{todayChallenge.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-church-gold/10 px-3 py-1 rounded-full">
                  +{todayChallenge.points} pts
                </span>
                {!isParticipating(todayChallenge.id) && !isCompleted(todayChallenge.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleParticipate(todayChallenge.id)}
                    className="text-church-gold border-church-gold"
                  >
                    Participer
                  </Button>
                )}
                {isParticipating(todayChallenge.id) && !isCompleted(todayChallenge.id) && (
                  <Button
                    size="sm"
                    onClick={() => handleComplete(todayChallenge.id)}
                    className="bg-church-gold text-white"
                  >
                    <CheckCircle size={14} className="mr-1" /> Compléter
                  </Button>
                )}
                {isCompleted(todayChallenge.id) && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Complété ✅
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
              onClick={() => {
                setFilterCategory('');
                setFilterFrequency('');
              }}
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
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {challenge.category}
                          </span>
                        )}
                      </div>
                      <span className="text-xs bg-church-gold/10 text-church-gold px-2 py-0.5 rounded-full">
                        +{challenge.points} pts
                      </span>
                    </div>
                    <CardTitle className="text-church-navy text-lg line-clamp-1">
                      {challenge.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-gray-400">
                        {challenge._count.participations} participants
                      </span>
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