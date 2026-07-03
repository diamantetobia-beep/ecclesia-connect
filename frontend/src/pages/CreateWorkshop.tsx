import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshop.service';
import { authService } from '../services/auth.service';
import { uploadService } from '../services/upload.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Users, Upload, X } from 'lucide-react';

const CATEGORIES = [
  'Chorale',
  'Danse',
  'Média',
  'Évangélisation',
  'Intercession',
  'Prière',
  'Étude biblique',
  'Jeunesse',
  'Femmes',
  'Hommes',
];

export default function CreateWorkshop() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: '',
    leaderId: '',
  });
  const [error, setError] = useState('');

  // Vérifier le rôle de l'utilisateur
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await authService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Erreur chargement utilisateurs', err);
      }
    };
    loadUsers();
  }, []);

  // Gestion de la sélection d'image
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');

    // Upload automatique
    uploadService
      .uploadWorkshopImage(file)
      .then((url) => {
        setForm((prev) => ({ ...prev, imageUrl: url }));
        setUploading(false);
      })
      .catch((err) => {
        console.error('Erreur upload:', err);
        setError('Erreur lors de l\'upload de l\'image. Vérifie ta connexion.');
        setImagePreview(null);
        setImageFile(null);
        setUploading(false);
      });
  };

  // Supprimer l'image sélectionnée
  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    // Réinitialiser l'input file
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category) {
      setError('Nom et catégorie requis.');
      return;
    }
    if (!form.leaderId) {
      setError('Veuillez choisir un responsable.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await workshopService.create(form);
      navigate('/workshops');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur n'est pas Super Admin, afficher un message d'erreur
  if (user.role !== 'Super Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 text-lg">⛔ Accès réservé aux administrateurs.</p>
            <Button onClick={() => navigate('/workshops')} className="mt-4 bg-church-gold text-white">
              Retour aux ateliers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Bouton de retour */}
        <button
          onClick={() => navigate('/workshops')}
          className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4 text-sm md:text-base"
        >
          <ArrowLeft size={20} /> Retour aux ateliers
        </button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-church-navy flex items-center gap-2">
              <Users className="text-church-gold" size={24} /> Créer un atelier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name">Nom de l'atelier *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Chorale de l'Église"
                  required
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-church-gold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-gold"
                  rows={4}
                  placeholder="Décris l'objectif et les activités de l'atelier..."
                />
              </div>

              {/* Image (upload) */}
              <div>
                <Label>Image de l'atelier (optionnel)</Label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="cursor-pointer"
                    />
                  </div>
                  {uploading && <Loader2 className="animate-spin text-church-gold" size={20} />}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Aperçu de l'image"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Aperçu</p>
                  </div>
                )}
                {form.imageUrl && !imagePreview && (
                  <p className="text-xs text-green-600 mt-1">✅ Image téléchargée</p>
                )}
              </div>

              {/* Responsable */}
              <div>
                <Label htmlFor="leader">Responsable *</Label>
                <select
                  id="leader"
                  value={form.leaderId}
                  onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-church-gold"
                  required
                >
                  <option value="">Choisir un responsable</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-church-gold hover:bg-church-gold/80 text-white font-semibold py-6 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Création en cours...
                  </>
                ) : (
                  'Créer l\'atelier'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}