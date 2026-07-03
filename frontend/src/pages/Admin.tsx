import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock, UserCheck, Users as UsersIcon, Check, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  photoUrl?: string;
  role: { name: string } | string;
  createdAt: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/auth/admin/users/${userId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: '✅ Compte activé avec succès' });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Erreur lors de l\'activation' });
    }
  };

  const rejectUser = async (userId: string) => {
    if (!confirm('⚠️ Voulez-vous vraiment rejeter cette demande ?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/auth/admin/users/${userId}/reject`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: '✅ Demande rejetée' });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Erreur lors du rejet' });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="animate-spin text-church-gold" size={40} />
      </div>
    );
  }

  const pendingUsers = users.filter(u => {
    const roleName = typeof u.role === 'string' ? u.role : u.role?.name;
    return !u.isActive && roleName !== 'Super Admin';
  });
  const activeUsers = users.filter(u => u.isActive);
  const totalUsers = users.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="text-church-gold" size={32} />
          <h1 className="text-2xl md:text-3xl font-bold text-church-navy">Administration</h1>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-church-navy">{totalUsers}</p>
              <p className="text-sm text-gray-500">Total membres</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{pendingUsers.length}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{activeUsers.length}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-church-navy text-white">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon size={20} /> Liste des membres
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-3 text-left">Photo</th>
                    <th className="p-3 text-left">Nom</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Rôle</th>
                    <th className="p-3 text-left">Statut</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleName = typeof user.role === 'string' ? user.role : user.role?.name || 'Membre';
                    const isPending = !user.isActive && roleName !== 'Super Admin';
                    const isActive = user.isActive;

                    return (
                      <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt="Photo" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                        <td className="p-3 text-gray-600">{user.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{roleName}</span>
                        </td>
                        <td className="p-3">
                          {isActive ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={16} /> Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-500">
                              <Clock size={16} /> En attente
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isPending && (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => activateUser(user.id)}
                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                title="Activer"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => rejectUser(user.id)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                title="Rejeter"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                          {isActive && roleName !== 'Super Admin' && (
                            <span className="text-xs text-gray-400">✔️ Validé</span>
                          )}
                          {roleName === 'Super Admin' && (
                            <span className="text-xs text-church-gold">👑 Admin</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}