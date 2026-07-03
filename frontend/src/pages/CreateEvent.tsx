import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eventService } from '../services/event.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  type: z.enum(['culte', 'reunion', 'repetition', 'camp', 'conference', 'autre']),
});

type EventForm = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: 'autre' },
  });

  const startDate = watch('startDate');

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    setError('');
    try {
      await eventService.create(data);
      navigate('/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-6">
          <ArrowLeft size={20} /> Retour
        </Link>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-church-gold/10 rounded-full">
                <Calendar className="text-church-gold" size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl text-church-navy">Créer un événement</CardTitle>
                <CardDescription>Remplis les informations ci-dessous</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label>Titre *</Label>
                <Input {...register('title')} placeholder="Ex: Culte de louange" className="mt-1 h-11" />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label>Description</Label>
                <textarea
                  {...register('description')}
                  placeholder="Décris l'événement..."
                  className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-gold resize-none"
                  rows={4}
                />
              </div>

              <div>
                <Label>Lieu</Label>
                <Input {...register('location')} placeholder="Ex: Église centrale" className="mt-1 h-11" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date de début *</Label>
                  <Input type="datetime-local" {...register('startDate')} className="mt-1 h-11" />
                  {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <Label>Date de fin *</Label>
                  <Input type="datetime-local" {...register('endDate')} className="mt-1 h-11" min={startDate} />
                  {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <select {...register('type')} className="w-full mt-1 h-11 px-3 border border-gray-200 rounded-lg bg-white">
                  <option value="culte">Culte</option>
                  <option value="reunion">Réunion</option>
                  <option value="repetition">Répétition</option>
                  <option value="camp">Camp</option>
                  <option value="conference">Conférence</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">❌ {error}</div>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/events')} className="flex-1 h-11">
                  Annuler
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 h-11 bg-church-gold hover:bg-church-gold/80 text-white">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}