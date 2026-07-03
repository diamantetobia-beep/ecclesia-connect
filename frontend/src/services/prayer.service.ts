import { api } from './api';

export const prayerService = {
  async getAll() {
    const res = await api.get('/prayers');
    return res.data;
  },
  async getOne(id: string) {
    const res = await api.get(`/prayers/${id}`);
    return res.data;
  },
  async create(data: { title: string; content: string }) {
    const res = await api.post('/prayers', data);
    return res.data;
  },
  async addComment(id: string, content: string) {
    const res = await api.post(`/prayers/${id}/comments`, { content });
    return res.data;
  },
  async togglePray(id: string) {
    const res = await api.post(`/prayers/${id}/pray`);
    return res.data;
  },
  async markAnswered(id: string) {
    const res = await api.patch(`/prayers/${id}/answered`);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/prayers/${id}`);
    return res.data;
  },
};