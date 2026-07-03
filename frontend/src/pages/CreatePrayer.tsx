import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prayerService } from '../services/prayer.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Heart } from 'lucide-react';

export default function CreatePrayer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Titre et contenu requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await prayerService.create(form);
      navigate('/prayers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/prayers')} className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4">
          <ArrowLeft size={20} /> Retour
        </button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-church-navy flex items-center gap-2">
              <Heart className="text-church-gold" size={24} /> Nouvelle demande de prière
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
                  placeholder="Ex: Prière pour la guérison de ma mère"
                />
              </div>
              <div>
                <Label>Contenu *</Label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-church-gold"
                  rows={6}
                  placeholder="Décris ta demande de prière..."
                />
              </div>
              {error && <div className="bg-red-50 text-red-600 p-2 rounded">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full bg-church-gold text-white">
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Envoyer la demande
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}