import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { libraryService } from '../services/library.service';
import { uploadService } from '../services/upload.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Upload, X, FileText } from 'lucide-react';

const TYPES = ['enseignement', 'pdf', 'podcast', 'chant', 'video', 'document'];
const CATEGORIES = ['Ancien Testament', 'Nouveau Testament', 'Théologie', 'Louange', 'Adoration', 'Enseignement', 'Témoignage', 'Autre'];

export default function CreateLibraryItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: TYPES[0],
    fileUrl: '',
    thumbnail: '',
    author: '',
    category: '',
    duration: '',
    isPublished: true,
  });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const url = await uploadService.uploadWorkshopImage(file);
      setForm({ ...form, fileUrl: url });
      setFilePreview(url);
    } catch (err) {
      setError('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadService.uploadWorkshopImage(file);
      setForm({ ...form, thumbnail: url });
    } catch (err) {
      setError('Erreur lors de l\'upload de la vignette');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.fileUrl) {
      setError('Titre et fichier requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await libraryService.create(form);
      navigate('/library');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/library')} className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4">
          <ArrowLeft size={20} /> Retour
        </button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-church-navy flex items-center gap-2">
              <FileText className="text-church-gold" size={24} /> Ajouter une ressource
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
                  placeholder="Titre de la ressource"
                />
              </div>
              <div>
                <Label>Type *</Label>
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
                <Label>Fichier *</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.mp3,.mp4,.wav,.ogg,.doc,.docx,.txt,.jpg,.png"
                    className="flex-1"
                  />
                  {uploading && <Loader2 className="animate-spin text-church-gold" size={20} />}
                </div>
                {form.fileUrl && <p className="text-xs text-green-600 mt-1">✅ Fichier uploadé</p>}
              </div>
              <div>
                <Label>Vignette (image de couverture)</Label>
                <Input
                  type="file"
                  onChange={handleThumbnailUpload}
                  accept="image/*"
                  className="mt-1"
                />
                {form.thumbnail && <p className="text-xs text-green-600 mt-1">✅ Vignette uploadée</p>}
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-church-gold"
                  rows={4}
                  placeholder="Description de la ressource..."
                />
              </div>
              <div>
                <Label>Auteur</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="mt-1"
                  placeholder="Nom de l'auteur"
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-white"
                >
                  <option value="">Sans catégorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Durée (ex: 12:30)</Label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="mt-1"
                  placeholder="12:30"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label className="text-sm font-normal">Publier immédiatement</Label>
              </div>
              {error && <div className="bg-red-50 text-red-600 p-2 rounded">{error}</div>}
              <Button type="submit" disabled={loading || uploading} className="w-full bg-church-gold text-white">
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Ajouter la ressource
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}