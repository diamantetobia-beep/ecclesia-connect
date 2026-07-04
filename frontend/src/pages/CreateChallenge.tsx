import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challenge.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Target } from 'lucide-react';

const TYPES = ['daily', 'weekly'];
const FREQUENCIES = ['daily', 'weekly'];
const CATEGORIES = ['lecture', 'priere', 'encouragement', 'service', 'étude'];

export default function CreateChallenge() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: TYPES[0],
    frequency: FREQUENCIES[0],
    points: 10,
    category: '',
    isDaily: false,  // ← Case à cocher "Défi du jour"
    date: '',        // ← Date optionnelle
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Titre et description requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!form.isDaily) {
        delete payload.date; // Si pas défi du jour, on n'envoie pas la date
      }
      await challengeService.create(payload);
      navigate('/challenges');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/challenges')}
          className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4"
        >
          <ArrowLeft size={20} /> Retour
        </button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-church-navy flex items-center gap-2">
              <Target className="text-church-gold" size={24} /> Créer un défi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Titre */}
              <div>
                <Label>Titre *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Lire un chapitre de la Bible"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description *</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-church-gold"
                  rows={4}
                  placeholder="Décris le défi..."
                />
              </div>

              {/* Type et Fréquence */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-white"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Fréquence</Label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-white"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Points */}
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })}
                  className="mt-1"
                  min="1"
                  max="100"
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label>Catégorie</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-white"
                >
                  <option value="">Sans catégorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* ✅ Case à cocher "Défi du jour" */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDaily"
                  checked={form.isDaily}
                  onChange={(e) => setForm({ ...form, isDaily: e.target.checked })}
                  className="w-4 h-4 text-church-gold border-gray-300 rounded focus:ring-church-gold"
                />
                <Label htmlFor="isDaily" className="cursor-pointer">
                  Définir comme défi du jour
                </Label>
              </div>

              {/* 🆕 Champ date (visible uniquement si case cochée) */}
              {form.isDaily && (
                <div>
                  <Label>Date (optionnelle)</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Laisse vide pour le jour courant
                  </p>
                </div>
              )}

              {error && <div className="bg-red-50 text-red-600 p-2 rounded">{error}</div>}

              {/* Bouton de soumission */}
              <Button type="submit" disabled={loading} className="w-full bg-church-gold text-white">
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Créer le défi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}