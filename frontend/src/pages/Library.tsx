import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryService } from '../services/library.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Music, Video, FileText, Headphones, Plus, User, Calendar, Filter, X } from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  thumbnail?: string;
  author?: string;
  category?: string;
  duration?: string;
  user: { firstName: string; lastName: string };
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  enseignement: BookOpen,
  pdf: FileText,
  podcast: Headphones,
  chant: Music,
  video: Video,
  document: FileText,
};

const typeColors: Record<string, string> = {
  enseignement: 'text-blue-600 bg-blue-50',
  pdf: 'text-red-600 bg-red-50',
  podcast: 'text-purple-600 bg-purple-50',
  chant: 'text-green-600 bg-green-50',
  video: 'text-orange-600 bg-orange-50',
  document: 'text-gray-600 bg-gray-50',
};

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadFilters = async () => {
    try {
      const [typesData, categoriesData] = await Promise.all([
        libraryService.getTypes(),
        libraryService.getCategories(),
      ]);
      setTypes(typesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Erreur chargement filtres', err);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await libraryService.getAll({
        type: filterType || undefined,
        category: filterCategory || undefined,
      });
      setItems(data);
    } catch (err) {
      setError('Impossible de charger la bibliothèque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filterType, filterCategory]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterCategory('');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-church-navy flex items-center gap-3">
              <BookOpen className="text-church-gold" size={28} /> Bibliothèque
            </h1>
            <p className="text-sm md:text-base text-gray-500">Enseignements, podcasts, chants et plus</p>
          </div>
          {(user?.role === 'Super Admin' || user?.role === 'Responsable') && (
            <Link to="/library/create">
              <Button className="bg-church-gold hover:bg-church-gold/80 text-white">
                <Plus size={18} className="mr-2" /> Ajouter une ressource
              </Button>
            </Link>
          )}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-church-navy transition"
            >
              <Filter size={18} /> Filtres
            </button>
            {(filterType || filterCategory) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <X size={16} /> Effacer
              </button>
            )}
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-sm"
                >
                  <option value="">Tous</option>
                  {types.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Catégorie</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-sm"
                >
                  <option value="">Toutes</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="mx-auto text-gray-300" size={64} />
            <p className="text-gray-500 mt-4 text-lg">Aucune ressource disponible.</p>
            {(user?.role === 'Super Admin' || user?.role === 'Responsable') && (
              <Link to="/library/create" className="inline-block mt-4 text-church-gold hover:underline">
                Ajouter la première ressource →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const Icon = typeIcons[item.type] || BookOpen;
              const colorClass = typeColors[item.type] || 'text-gray-600 bg-gray-50';
              const isMedia = item.type === 'video' || item.type === 'podcast' || item.type === 'chant';

              return (
                <Link to={`/library/${item.id}`} key={item.id} className="block group">
                  <Card className="h-full hover:shadow-lg transition border border-gray-100 overflow-hidden">
                    {item.thumbnail && (
                      <div className="w-full h-40 bg-gray-200 overflow-hidden">
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                    )}
                    {!item.thumbnail && (
                      <div className="w-full h-40 bg-gradient-to-br from-church-gold/10 to-church-navy/10 flex items-center justify-center">
                        <Icon size={48} className="text-gray-300" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${colorClass}`}>
                            <Icon size={14} />
                          </div>
                          <span className="text-xs text-gray-400">{item.type}</span>
                        </div>
                        {item.duration && (
                          <span className="text-xs text-gray-400">⏱️ {item.duration}</span>
                        )}
                      </div>
                      <CardTitle className="text-church-navy text-lg group-hover:text-church-gold transition line-clamp-1">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <User size={12} />
                        <span>{item.user.firstName} {item.user.lastName}</span>
                        <span>•</span>
                        <Calendar size={12} />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {item.category && (
                        <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}