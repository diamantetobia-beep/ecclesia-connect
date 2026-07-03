import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readingPlanService } from '../services/reading-plan.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, BookOpen, Plus, X } from 'lucide-react';

const TYPES = ['daily', 'weekly', 'yearly'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

export default function CreateReadingPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: TYPES[0],
    frequency: FREQUENCIES[0],
    verses: [] as string[],
  });
  const [verseInput, setVerseInput] = useState('');
  const [error, setError] = useState('');

  const addVerse = () => {
    if (!verseInput.trim()) return;
    setForm({ ...form, verses: [...form.verses, verseInput.trim()] });
    setVerseInput('');
  };

  const removeVerse = (index: number) => {
    setForm({ ...form, verses: form.verses.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.verses.length === 0) {
      setError('Titre et au moins un verset sont requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await readingPlanService.create(form);
      navigate('/reading-plans');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/reading-plans')} className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4">
          <ArrowLeft size={20} /> Retour
        </button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-church-navy flex items-center gap-2">
              <BookOpen className="text-church-gold" size={24} /> Créer un plan de lecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Titre *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Le Nouveau Testament en 90 jours"
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-church-gold"
                  rows={3}
                  placeholder="Décris ce plan..."
                />
              </div>
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
              <div>
                <Label>Versets (références) *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={verseInput}
                    onChange={(e) => setVerseInput(e.target.value)}
                    placeholder="Ex: Jean 3:16"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && addVerse()}
                  />
                  <Button type="button" onClick={addVerse} variant="outline" className="border-church-gold text-church-gold">
                    <Plus size={18} />
                  </Button>
                </div>
                {form.verses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.verses.map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-church-gold/10 text-church-navy px-2 py-1 rounded-full text-sm">
                        {v}
                        <button type="button" onClick={() => removeVerse(i)} className="text-gray-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">{form.verses.length} versets ajoutés</p>
              </div>
              {error && <div className="bg-red-50 text-red-600 p-2 rounded">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full bg-church-gold text-white">
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Créer le plan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}