import { api } from './api';

export const chatService = {
  async getConversations() {
    const res = await api.get('/chat/conversations');
    return res.data;
  },
  async createPrivateConversation(userId: string) {
    const res = await api.post(`/chat/conversations/private/${userId}`);
    return res.data;
  },
  async createGroup(name: string, memberIds: string[]) {
    const res = await api.post('/chat/conversations/group', { name, memberIds });
    return res.data;
  },
  async getMessages(conversationId: string) {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },
  async sendMessage(conversationId: string, content: string, fileUrl?: string, fileType?: string) {
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      fileUrl,
      fileType,
    });
    return res.data;
  },
  async markAsRead(messageId: string) {
    const res = await api.post(`/chat/messages/${messageId}/read`);
    return res.data;
  },
  async markAllAsRead(conversationId: string) {
    const res = await api.post(`/chat/conversations/${conversationId}/read-all`);
    return res.data;
  },
  async getUnreadCount() {
    const res = await api.get('/chat/unread');
    return res.data;
  },
  async getUsers() {
    const res = await api.get('/chat/users');
    return res.data;
  },
};