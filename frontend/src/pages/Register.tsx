import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '../services/auth.service';
import { uploadService } from '../services/upload.service';
import { Eye, EyeOff, Loader2, Camera, X } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Au moins 6 caractères'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Gestion de l'upload de la photo de profil (obligatoire)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');

    try {
      const url = await uploadService.uploadWorkshopImage(file);
      setPhotoUrl(url);
    } catch (err) {
      setError('Erreur lors de l\'upload de la photo');
      setPhotoPreview(null);
      setPhotoFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoUrl('');
    const input = document.getElementById('photo-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const onSubmit = async (data: RegisterForm) => {
    // ✅ Vérifier que la photo a bien été uploadée
    if (!photoUrl) {
      setError('⚠️ Une photo de profil est obligatoire. Veuillez en télécharger une.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await authService.register(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        photoUrl
      );
      setSuccess(response.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-church-cream p-4">
      <Card className="w-[400px] max-w-full shadow-lg border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-church-navy rounded-full flex items-center justify-center mb-4 overflow-hidden">
            <img src="/logo-eglise.jpeg" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <CardTitle className="text-2xl text-church-navy">Inscription</CardTitle>
          <CardDescription>Rejoins la communauté Ecclesia Connect</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Photo de profil (obligatoire) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo de profil <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-gray-400" size={24} />
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploading}
                    className="text-sm"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={16} className="mr-1" /> : 'Choisir une photo'}
                  </Button>
                  {photoUrl && <p className="text-xs text-green-600 mt-1">✅ Photo téléchargée</p>}
                  {!photoUrl && !uploading && <p className="text-xs text-gray-400 mt-1">Obligatoire</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input placeholder="Prénom" {...register('firstName')} className="h-12" />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Input placeholder="Nom" {...register('lastName')} className="h-12" />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <Input placeholder="Email" type="email" {...register('email')} className="h-12" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <Input
                placeholder="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="h-12 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-600 text-sm text-center">{success}</p>}

            <Button type="submit" className="w-full h-12 bg-church-gold hover:bg-church-gold/80 text-white" disabled={loading || uploading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-church-gold font-semibold">
                Connecte-toi
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}