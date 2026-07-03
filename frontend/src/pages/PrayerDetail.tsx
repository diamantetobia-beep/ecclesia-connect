import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { prayerService } from '../services/prayer.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Heart, MessageCircle, CheckCircle, Clock, ArrowLeft, Trash2, User } from 'lucide-react';

interface PrayerDetail {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  user: { id: string; firstName: string; lastName: string; photoUrl?: string };
  comments: { id: string; content: string; user: { id: string; firstName: string; lastName: string; photoUrl?: string }; createdAt: string }[];
  reactions: { id: string; user: { id: string; firstName: string; lastName: string; photoUrl?: string } }[];
  createdAt: string;
}

export default function PrayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prayer, setPrayer] = useState<PrayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [hasPrayed, setHasPrayed] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadPrayer = async () => {
    if (!id) return;
    try {
      const data = await prayerService.getOne(id);
      setPrayer(data);
      // Vérifier si l'utilisateur a déjà prié
      if (user?.id) {
        setHasPrayed(data.reactions.some((r: any) => r.user.id === user.id));
      }
    } catch (err) {
      setError('Demande introuvable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrayer();
  }, [id, user]);

  const handlePray = async () => {
    if (!id) return;
    try {
      await prayerService.togglePray(id);
      setHasPrayed(!hasPrayed);
      loadPrayer();
    } catch (err) {
      alert('Erreur');
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || !id) return;
    setSending(true);
    try {
      await prayerService.addComment(id, comment);
      setComment('');
      loadPrayer();
    } catch (err) {
      alert('Erreur');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAnswered = async () => {
    if (!id || !confirm('Marquer cette demande comme exaucée ?')) return;
    try {
      await prayerService.markAnswered(id);
      loadPrayer();
    } catch (err) {
      alert('Erreur');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Supprimer cette demande ?')) return;
    try {
      await prayerService.delete(id);
      navigate('/prayers');
    } catch (err) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-church-gold" size={40} /></div>;
  if (error || !prayer) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Introuvable'}</div>;

  const isAuthor = user?.id === prayer.user.id;
  const isAdmin = user?.role === 'Super Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/prayers')} className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4">
          <ArrowLeft size={20} /> Retour aux demandes
        </button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {prayer.user.photoUrl ? (
                    <img src={prayer.user.photoUrl} alt="Photo" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                      {prayer.user.firstName[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{prayer.user.firstName} {prayer.user.lastName}</span>
                  <span className="text-xs text-gray-400">• {new Date(prayer.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-2xl text-church-navy">{prayer.title}</CardTitle>
                {prayer.isAnswered && (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm bg-green-50 px-2 py-1 rounded-full mt-2">
                    <CheckCircle size={16} /> Exaucée
                  </span>
                )}
              </div>
              {(isAuthor || isAdmin) && (
                <div className="flex gap-2">
                  {!prayer.isAnswered && (
                    <Button onClick={handleMarkAnswered} variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      <CheckCircle size={16} className="mr-1" /> Exaucée
                    </Button>
                  )}
                  <Button onClick={handleDelete} variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 whitespace-pre-wrap">{prayer.content}</p>

            {/* Bouton Prière */}
            <div className="flex items-center gap-4 py-2 border-t border-b border-gray-100">
              <Button onClick={handlePray} className={`${hasPrayed ? 'bg-red-500 hover:bg-red-600' : 'bg-church-gold hover:bg-church-gold/80'} text-white`}>
                <Heart size={18} className="mr-2" fill={hasPrayed ? 'white' : 'none'} />
                {hasPrayed ? 'Je ne prie plus' : 'Je prie pour toi'}
              </Button>
              <span className="text-sm text-gray-500">{prayer.reactions.length} personne(s) prient</span>
            </div>

            {/* Liste de ceux qui prient */}
            {prayer.reactions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">🕊️ Ceux qui prient :</p>
                <div className="flex flex-wrap gap-2">
                  {prayer.reactions.map((r) => (
                    <span key={r.id} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {r.user.firstName} {r.user.lastName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Commentaires */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">💬 Commentaires ({prayer.comments.length})</p>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {prayer.comments.map((c) => (
                  <div key={c.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      {c.user.photoUrl ? (
                        <img src={c.user.photoUrl} alt="Photo" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-[8px] font-bold">
                          {c.user.firstName[0]}
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700">{c.user.firstName} {c.user.lastName}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && comment.trim() && handleComment()}
                />
                <Button onClick={handleComment} disabled={sending || !comment.trim()} className="bg-church-gold text-white">
                  {sending ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}