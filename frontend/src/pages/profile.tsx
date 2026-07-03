import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Church,
  Camera,
  Save,
  Loader2,
  Calendar,
  Users,
} from 'lucide-react';

// Schéma de validation Zod
const profileSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (minimum 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caractères)'),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  neighborhood: z.string().optional(),
  profession: z.string().optional(),
  studies: z.string().optional(),
  talents: z.string().optional(),
  ministry: z.string().optional(),
  interests: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserProfile extends ProfileForm {
  id: string;
  email: string;
  isActive: boolean;
  role: { name: string };
  createdAt: string;
  photoUrl?: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  // Charger le profil depuis le backend
  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      reset({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        gender: res.data.gender || '',
        birthDate: res.data.birthDate ? res.data.birthDate.split('T')[0] : '',
        phone: res.data.phone || '',
        neighborhood: res.data.neighborhood || '',
        profession: res.data.profession || '',
        studies: res.data.studies || '',
        talents: res.data.talents?.join(', ') || '',
        ministry: res.data.ministry || '',
        interests: res.data.interests?.join(', ') || '',
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: '❌ Erreur lors du chargement du profil' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Sauvegarder le profil
  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      // Convertir les listes en tableaux
      const payload = {
        ...data,
        talents: data.talents ? data.talents.split(',').map((s) => s.trim()).filter(Boolean) : [],
        interests: data.interests ? data.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      await api.patch('/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: '✅ Profil mis à jour avec succès' });
      loadProfile(); // Recharger les données
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || '❌ Erreur lors de la mise à jour',
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload de la photo de profil
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification du type et de la taille (optionnelle)
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '❌ Veuillez sélectionner une image' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '❌ L\'image ne doit pas dépasser 5 Mo' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/upload/profile-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Mettre à jour l'utilisateur avec la nouvelle photo
      setUser((prev) => ({ ...prev!, photoUrl: res.data.url }));
      setMessage({ type: 'success', text: '✅ Photo de profil mise à jour' });
      loadProfile(); // Recharger pour avoir l'URL à jour
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || '❌ Erreur lors de l\'upload',
      });
    } finally {
      setUploading(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <div className="animate-pulse text-church-navy text-xl flex items-center gap-2">
          <Loader2 className="animate-spin" size={24} /> Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-8">
          <User className="text-church-gold" size={32} />
          <h1 className="text-3xl font-bold text-church-navy">Mon Profil</h1>
        </div>

        {/* Message de retour */}
        {message.text && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Carte photo de profil */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-church-navy to-church-gold/30 flex items-center justify-center overflow-hidden border-4 border-church-gold/40 shadow-lg">
                  {user?.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-church-navy">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-church-gold text-white p-2 rounded-full shadow-lg hover:bg-church-gold/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-church-navy">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1">
                  <Mail size={14} /> {user?.email}
                </p>
                <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1">
                  <Church size={14} /> {user?.role?.name}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Membre depuis le {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'édition */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-church-navy text-xl">Informations personnelles</CardTitle>
            <CardDescription>
              Complète ou modifie tes informations ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Prénom</Label>
                  <Input
                    {...register('firstName')}
                    className="mt-1 h-11"
                    placeholder="Jean"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nom</Label>
                  <Input
                    {...register('lastName')}
                    className="mt-1 h-11"
                    placeholder="Dupont"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Genre et Date de naissance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Genre</Label>
                  <select
                    {...register('gender')}
                    className="w-full mt-1 h-11 px-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  >
                    <option value="">Non précisé</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date de naissance</Label>
                  <Input
                    type="date"
                    {...register('birthDate')}
                    className="mt-1 h-11"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                <Input
                  {...register('phone')}
                  className="mt-1 h-11"
                  placeholder="+237 6XX XX XX XX"
                />
              </div>

              {/* Quartier */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Quartier de résidence</Label>
                <Input
                  {...register('neighborhood')}
                  className="mt-1 h-11"
                  placeholder="Quartier"
                />
              </div>

              {/* Profession et Études */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Profession</Label>
                  <Input
                    {...register('profession')}
                    className="mt-1 h-11"
                    placeholder="Profession"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Études</Label>
                  <Input
                    {...register('studies')}
                    className="mt-1 h-11"
                    placeholder="Niveau d'études"
                  />
                </div>
              </div>

              {/* Talents */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Talents <span className="text-gray-400 text-xs">(séparés par des virgules)</span>
                </Label>
                <Input
                  {...register('talents')}
                  className="mt-1 h-11"
                  placeholder="Chant, Piano, Graphisme, Sonorisation..."
                />
              </div>

              {/* Ministère */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Ministère</Label>
                <Input
                  {...register('ministry')}
                  className="mt-1 h-11"
                  placeholder="Ministère d'appartenance"
                />
              </div>

              {/* Centres d'intérêt */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Centres d'intérêt <span className="text-gray-400 text-xs">(séparés par des virgules)</span>
                </Label>
                <Input
                  {...register('interests')}
                  className="mt-1 h-11"
                  placeholder="Sport, Lecture, Musique, Voyages..."
                />
              </div>

              {/* Bouton d'envoi */}
              <Button
                type="submit"
                className="w-full h-12 bg-church-gold hover:bg-church-gold/80 text-white font-medium transition"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}