import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService } from '../services/chat.service';
import { uploadService } from '../services/upload.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ArrowLeft, Paperclip, Mic, MicOff, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  sender: { id: string; firstName: string; lastName: string; photoUrl?: string };
  createdAt: string;
  readBy: string[];
}

export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadMessages = async () => {
    if (!id) return;
    try {
      const data = await chatService.getMessages(id);
      setMessages(data);
      // Marquer comme lus
      await chatService.markAllAsRead(id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    try {
      await chatService.sendMessage(id, newMessage);
      setNewMessage('');
      loadMessages();
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

      await chatService.sendMessage(id, '', url, fileType);
      loadMessages();
    } catch (err) {
      alert('Erreur upload');
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
          await chatService.sendMessage(id, '', url, 'audio');
          loadMessages();
        } catch (err) {
          alert('Erreur audio');
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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="animate-spin text-church-gold" size={40} />
      </div>
    );
  }

  const conversationName = id === 'general' ? '📢 Général' : 'Discussion';

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-4 md:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-church-navy/5">
            <button onClick={() => navigate('/chat')} className="text-gray-500 hover:text-church-navy transition">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <p className="font-semibold text-church-navy">{conversationName}</p>
              <p className="text-xs text-gray-400">{messages.length} messages</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
            {messages.map((msg) => {
              const isOwn = isOwnMessage(msg.sender.id);
              const isRead = msg.readBy?.includes(user?.id);

              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'bg-church-gold text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-3`}>
                    {!isOwn && (
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </p>
                    )}
                    {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                    {msg.fileUrl && (
                      <div className="mt-2">
                        {msg.fileType === 'image' && (
                          <img src={msg.fileUrl} alt="Image" className="max-w-full rounded max-h-48" />
                        )}
                        {msg.fileType === 'video' && (
                          <video src={msg.fileUrl} controls className="max-w-full rounded max-h-48" />
                        )}
                        {msg.fileType === 'audio' && (
                          <audio src={msg.fileUrl} controls className="w-full" />
                        )}
                        {msg.fileType === 'document' && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                            📄 Voir le document
                          </a>
                        )}
                      </div>
                    )}
                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                      {isOwn && (
                        isRead ? <CheckCheck size={12} /> : <Check size={12} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="border-church-gold text-church-gold"
              >
                <Paperclip size={18} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? 'border-red-500 text-red-500 bg-red-50' : 'border-church-gold text-church-gold'}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 min-w-[150px]"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button onClick={handleSend} disabled={sending || (!newMessage.trim() && !uploadingFile)} className="bg-church-gold text-white">
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </Button>
            </div>
            {isRecording && <p className="text-xs text-red-500 mt-2 animate-pulse">🔴 Enregistrement en cours...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}