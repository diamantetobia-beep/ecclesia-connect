import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, MessageCircle } from 'lucide-react';

export default function Ia() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Message d'accueil
  const welcomeMessage =
    '👋 Bonjour ! Je suis ton assistant Ecclesia Connect.\n' +
    'Je peux t\'aider à utiliser l\'application, te guider pas à pas, ' +
    'et rechercher des informations (ateliers, événements, publications, etc.) auxquelles tu as accès.\n\n' +
    '💡 Exemples :\n' +
    '• "Comment créer un compte ?"\n' +
    '• "Atelier Chorale"\n' +
    '• "Quels sont les événements à venir ?"\n' +
    '• "Comment envoyer un message ?"';

  const ask = async () => {
    if (!query.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setResponse('');
    try {
      // On utilise l'endpoint /ia/ask
      const res = await api.post('/ia/ask', { query });
      setResponse(res.data.response);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setResponse('❌ Erreur : ' + (err.response?.data?.message || 'Réessaie plus tard.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-church-gold" size={32} />
          <h1 className="text-3xl font-bold text-church-navy">Assistant Ecclesia</h1>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-church-navy text-xl flex items-center gap-2">
              <MessageCircle className="text-church-gold" size={24} />
              En quoi puis-je t'aider ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Pose ta question sur l'application..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 h-12"
                onKeyDown={(e) => e.key === 'Enter' && ask()}
              />
              <Button
                onClick={ask}
                disabled={loading || !query.trim()}
                className="h-12 bg-church-gold hover:bg-church-gold/80 text-white px-8"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Poser'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affichage de la réponse */}
        {response && (
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{response}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message d'accueil si aucune réponse */}
        {!response && !loading && (
          <Card className="border-0 shadow-lg bg-gray-50/80">
            <CardContent className="p-6">
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{welcomeMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}