import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chat.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, User, Users, Plus, Check } from 'lucide-react';

export default function NewChat() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await chatService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const startChat = async () => {
    if (selectedUsers.length === 0) return;

    if (isGroup) {
      const conv = await chatService.createGroup(groupName || 'Groupe', selectedUsers);
      navigate(`/chat/${conv.id}`);
    } else {
      const conv = await chatService.createPrivateConversation(selectedUsers[0]);
      navigate(`/chat/${conv.id}`);
    }
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
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/chat')} className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition mb-4">
          ← Retour
        </button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-church-navy">Nouvelle discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant={!isGroup ? 'default' : 'outline'}
                onClick={() => setIsGroup(false)}
                className={!isGroup ? 'bg-church-gold text-white' : ''}
              >
                <User size={16} className="mr-1" /> Privé
              </Button>
              <Button
                variant={isGroup ? 'default' : 'outline'}
                onClick={() => setIsGroup(true)}
                className={isGroup ? 'bg-church-gold text-white' : ''}
              >
                <Users size={16} className="mr-1" /> Groupe
              </Button>
            </div>

            {isGroup && (
              <div className="mb-4">
                <Input
                  placeholder="Nom du groupe (optionnel)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <p className="text-sm text-gray-500 mb-2">
              {selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''}
              {isGroup && selectedUsers.length < 2 && ' (min. 2 pour un groupe)'}
            </p>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    selectedUsers.includes(u.id) ? 'bg-church-gold/10 border border-church-gold' : 'hover:bg-gray-50'
                  }`}
                >
                  {u.photoUrl ? (
                    <img src={u.photoUrl} alt="Photo" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-church-navy text-white flex items-center justify-center text-sm font-bold">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  {selectedUsers.includes(u.id) && <Check className="text-church-gold" size={18} />}
                </div>
              ))}
            </div>

            <Button
              onClick={startChat}
              disabled={selectedUsers.length === 0 || (isGroup && selectedUsers.length < 2)}
              className="w-full mt-4 bg-church-gold text-white"
            >
              <Plus size={18} className="mr-2" />
              Démarrer la discussion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}