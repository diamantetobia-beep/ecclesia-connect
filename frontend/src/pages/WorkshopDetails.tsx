import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workshopService } from '../services/workshop.service';
import { uploadService } from '../services/upload.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Home,
  Users,
  MessageCircle,
  Calendar,
  Archive,
  UserPlus,
  UserMinus,
  Check,
  X,
  Send,
  Loader2,
  Trash2,
  Plus,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Clock,
  User,
} from 'lucide-react';

interface WorkshopDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  leader: { id: string; firstName: string; lastName: string; email: string };
  members: { id: string; user: { id: string; firstName: string; lastName: string; email: string }; status: string }[];
  chat: { id: string; user: { id: string; firstName: string; lastName: string }; message: string; fileUrl?: string; fileType?: string; createdAt: string }[];
  schedules: { id: string; title: string; description: string; date: string }[];
  archives: { id: string; title: string; description: string; fileUrl: string; type: string; createdAt: string }[];
}

export default function WorkshopDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadWorkshop = async () => {
    if (!id) return;
    try {
      const data = await workshopService.getOne(id);
      setWorkshop(data);
    } catch (err) {
      setError('Atelier introuvable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkshop();
  }, [id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [workshop?.chat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    try {
      await workshopService.sendChat(id, newMessage);
      setNewMessage('');
      loadWorkshop();
    } catch (err) {
      alert('Erreur');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploadingFile(true);
    try {
      const url = await uploadService.uploadWorkshopImage(file);
      let fileType = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      await workshopService.sendChat(id, '', url, fileType);
      loadWorkshop();
    } catch (err) {
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });

        setUploadingFile(true);
        try {
          const url = await uploadService.uploadWorkshopImage(file);
          if (id) {
            await workshopService.sendChat(id, '', url, 'audio');
            loadWorkshop();
          }
        } catch (err) {
          alert('Erreur lors de l\'upload audio');
        } finally {
          setUploadingFile(false);
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleApprove = async (userId: string) => {
    if (!id) return;
    try {
      await workshopService.approve(id, userId);
      loadWorkshop();
    } catch (err) {
      alert('Erreur');
    }
  };

  const handleReject = async (userId: string) => {
    if (!id) return;
    try {
      await workshopService.reject(id, userId);
      loadWorkshop();
    } catch (err) {
      alert('Erreur');
    }
  };

  const handleLeave = async () => {
    if (!id || !confirm('Quitter cet atelier ?')) return;
    try {
      await workshopService.leave(id);
      navigate('/workshops');
    } catch (err) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-church-gold" size={40} /></div>;
  if (error || !workshop) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Atelier introuvable'}</div>;

  const isLeader = user?.id === workshop.leader.id;
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Responsable';
  const isMember = workshop.members.some(m => m.user.id === user?.id && m.status === 'approved');
  const isPending = workshop.members.some(m => m.user.id === user?.id && m.status === 'pending');

  const pendingMembers = workshop.members.filter(m => m.status === 'pending');
  const approvedMembers = workshop.members.filter(m => m.status === 'approved');

  const renderMessage = (msg: any) => {
    const isOwn = msg.user.id === user?.id;

    return (
      <div key={msg.id} className={`p-3 rounded-lg ${isOwn ? 'bg-church-gold/10 ml-auto max-w-[80%]' : 'bg-gray-100 max-w-[80%]'}`}>
        <p className="text-xs text-gray-500 font-semibold">{msg.user.firstName} {msg.user.lastName}</p>
        {msg.message && <p className="text-sm">{msg.message}</p>}
        {msg.fileUrl && (
          <div className="mt-2">
            {msg.fileType === 'image' && <img src={msg.fileUrl} alt="Image" className="max-w-full rounded max-h-64 object-contain" />}
            {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="max-w-full rounded max-h-64" />}
            {msg.fileType === 'audio' && <audio src={msg.fileUrl} controls className="w-full" />}
            {msg.fileType === 'document' && (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-church-gold underline flex items-center gap-1">
                <FileText size={16} /> Voir le document
              </a>
            )}
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* En-tête avec retour et menu principal */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/workshops')}
            className="flex items-center gap-2 text-gray-500 hover:text-church-navy transition text-sm md:text-base"
          >
            <ArrowLeft size={20} /> Retour aux ateliers
          </button>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="text-church-navy border-church-gold hover:bg-church-gold/10">
              <Home size={16} className="mr-1" /> Menu
            </Button>
          </Link>
        </div>

        {/* En-tête atelier */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-church-navy">{workshop.name}</h1>
              <p className="text-gray-500 text-sm">{workshop.category} • Responsable : {workshop.leader.firstName} {workshop.leader.lastName}</p>
              {workshop.description && <p className="text-gray-600 mt-2 text-sm">{workshop.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {isMember && (
                <button onClick={handleLeave} className="px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition text-sm">
                  <UserMinus size={18} className="inline mr-1" /> Quitter
                </button>
              )}
              {!isMember && !isPending && !isLeader && (
                <Button onClick={async () => { await workshopService.join(workshop.id); loadWorkshop(); }} className="bg-church-gold text-white text-sm">
                  <UserPlus size={18} className="mr-1" /> Rejoindre
                </Button>
              )}
              {isPending && <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm">⏳ Demande en attente</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="bg-white border border-gray-100 rounded-lg p-1 flex flex-wrap overflow-x-auto">
            <TabsTrigger value="members" className="flex items-center gap-1 text-xs md:text-sm"><Users size={16} /> Membres</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1 text-xs md:text-sm"><MessageCircle size={16} /> Chat</TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-1 text-xs md:text-sm"><Calendar size={16} /> Planning</TabsTrigger>
            <TabsTrigger value="archives" className="flex items-center gap-1 text-xs md:text-sm"><Archive size={16} /> Archives</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader><CardTitle className="text-church-navy text-lg">Membres ({approvedMembers.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {approvedMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm">{m.user.firstName} {m.user.lastName}</span>
                      {m.user.id === workshop.leader.id && <span className="text-xs text-church-gold font-medium">Responsable</span>}
                    </div>
                  ))}
                </div>
                {(isLeader || isAdmin) && pendingMembers.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="font-semibold text-sm text-gray-500 mb-3">Demandes en attente ({pendingMembers.length}) :</p>
                    {pendingMembers.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg mb-2">
                        <span className="text-sm">{m.user.firstName} {m.user.lastName}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(m.user.id)} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={18} /></button>
                          <button onClick={() => handleReject(m.user.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><X size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader><CardTitle className="text-church-navy text-lg">Chat de l'atelier</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {workshop.chat.map(renderMessage)}
                  <div ref={chatEndRef} />
                </div>
                {(isMember || isLeader || isAdmin) && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-1 min-w-[150px]"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="bg-church-gold text-white">
                        {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                      />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="text-sm border-church-gold text-church-gold hover:bg-church-gold/10">
                        {uploadingFile ? <Loader2 className="animate-spin" size={16} className="mr-1" /> : <Paperclip size={16} className="mr-1" />}
                        Fichier
                      </Button>
                      <Button type="button" variant="outline" onClick={isRecording ? stopRecording : startRecording} className={`text-sm ${isRecording ? 'border-red-500 text-red-500 bg-red-50' : 'border-church-gold text-church-gold hover:bg-church-gold/10'}`}>
                        {isRecording ? <MicOff size={16} className="mr-1" /> : <Mic size={16} className="mr-1" />}
                        {isRecording ? 'Arrêter' : 'Audio'}
                      </Button>
                    </div>
                    {isRecording && <p className="text-xs text-red-500 animate-pulse">🔴 Enregistrement en cours...</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
            <Card>
              <CardHeader><CardTitle className="text-church-navy text-lg">Planning</CardTitle></CardHeader>
              <CardContent>
                {workshop.schedules.length === 0 && <p className="text-gray-500">Aucun planning pour l'instant.</p>}
                {workshop.schedules.map(s => (
                  <div key={s.id} className="p-3 border-b border-gray-100">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-gray-500">{s.description}</p>
                    <p className="text-sm text-church-gold">{new Date(s.date).toLocaleDateString()} à {new Date(s.date).toLocaleTimeString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archives">
            <Card>
              <CardHeader><CardTitle className="text-church-navy text-lg">Archives</CardTitle></CardHeader>
              <CardContent>
                {workshop.archives.length === 0 && <p className="text-gray-500">Aucune archive.</p>}
                {workshop.archives.map(a => (
                  <div key={a.id} className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-sm text-gray-500">{a.description}</p>
                      <p className="text-xs text-gray-400">📂 {a.type}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}