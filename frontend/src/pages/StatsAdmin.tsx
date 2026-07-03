import { useEffect, useState } from 'react';
import { statsService } from '../services/stats.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, BookOpen, Heart, Calendar, MessageCircle } from 'lucide-react';

export default function StatsAdmin() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await statsService.getAdmin();
      setStats(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📊 Statistiques</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center"><Users className="mx-auto" /><p className="text-2xl font-bold">{stats?.members?.total || 0}</p><p className="text-sm text-gray-500">Membres</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><BookOpen className="mx-auto" /><p className="text-2xl font-bold">{stats?.workshops || 0}</p><p className="text-sm text-gray-500">Ateliers</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Heart className="mx-auto" /><p className="text-2xl font-bold">{stats?.prayers?.total || 0}</p><p className="text-sm text-gray-500">Prières</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Calendar className="mx-auto" /><p className="text-2xl font-bold">{stats?.events || 0}</p><p className="text-sm text-gray-500">Événements</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
        <CardContent>
          {stats?.recentActivity?.length === 0 ? <p>Aucune activité</p> :
            stats?.recentActivity?.map((post: any) => (
              <div key={post.id} className="border-b py-2">
                <strong>{post.author?.firstName} {post.author?.lastName}</strong> a publié : {post.content}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}