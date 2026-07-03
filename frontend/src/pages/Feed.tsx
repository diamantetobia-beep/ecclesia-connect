import { useEffect, useState } from 'react';
import { postService } from '../services/post.service';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await postService.getAll();
        setPosts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center p-10">Chargement...</div>;

  return (
    <div className="min-h-screen bg-church-cream p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-church-navy mb-6">📰 Fil d'actualité</h1>
        {posts.length === 0 ? (
          <p className="text-gray-500">Aucune publication pour l'instant.</p>
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="bg-white p-5 rounded-xl shadow mb-4">
              <p className="text-gray-800">{post.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}