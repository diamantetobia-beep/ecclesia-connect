import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chat.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MessageCircle, Users, User, Plus, Clock, Hash } from 'lucide-react';

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  participants: { user: { id: string; firstName: string; lastName: string; photoUrl?: string } }[];
  messages: { content: string; createdAt: string }[];
  _count: { messages: number };
  updatedAt: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      // Trier : salon général en premier
      const sorted = data.sort((a: Conversation, b: Conversation) => {
        if (a.id === 'general') return -1;
        if (b.id === 'general') return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setConversations(sorted);
    } catch (err) {
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const getConversationName = (conv: Conversation) => {
    if (conv.id === 'general') return '📢 Général';
    if (conv.type === 'group') return conv.name || 'Groupe';
    const other = conv.participants.find(p => p.user.id !== user?.id);
    return other ? `${other.user.firstName} ${other.user.lastName}` : 'Inconnu';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.id === 'general') {
      return <Hash className="text-church-gold" size={24} />;
    }
    if (conv.type === 'group') {
      return <Users className="text-gray-400" size={24} />;
    }
    const other = conv.participants.find(p => p.user.id !== user?.id);
    return other?.user.photoUrl ? (
      <img src={other.user.photoUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
    ) : (
      <div className="w-10 h-10 rounded-full bg-church-navy text-white flex items-center justify-center text-sm font-bold">
        {other ? other.user.firstName[0] : '?'}
      </div>
    );
  };

  const getLastMessage = (conv: Conversation) => {
    const last = conv.messages[0];
    return last ? last.content || '📎 Fichier' : 'Aucun message';
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="animate-spin text-church-gold" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-church-gold" size={28} />
            <h1 className="text-2xl md:text-3xl font-bold text-church-navy">Messages</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/chat/new')}
            className="border-church-gold text-church-gold"
          >
            <Plus size={18} className="mr-1" /> Nouvelle discussion
          </Button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {conversations.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageCircle className="mx-auto text-gray-300" size={64} />
              <p className="text-gray-500 mt-4 text-lg">Aucune conversation.</p>
              <Button
                onClick={() => navigate('/chat/new')}
                className="mt-4 bg-church-gold text-white"
              >
                <Plus size={18} className="mr-2" /> Démarrer une discussion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition cursor-pointer ${
                  conv.id === 'general' ? 'border-church-gold/30 bg-church-gold/5' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">{getConversationAvatar(conv)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-church-navy">{getConversationName(conv)}</p>
                      {conv.id === 'general' && (
                        <span className="text-xs bg-church-gold/20 text-church-gold px-2 py-0.5 rounded-full">
                          Général
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{getLastMessage(conv)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(conv.updatedAt)}</p>
                    <span className="text-xs text-gray-400">{conv._count.messages} messages</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}