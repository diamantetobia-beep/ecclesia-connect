import { api } from './api';

export const challengeService = {
  async getAll() {
    const res = await api.get('/challenges');
    return res.data;
  },
  async getOne(id: string) {
    const res = await api.get(`/challenges/${id}`);
    return res.data;
  },
  async getDaily() {
    const res = await api.get('/challenges/daily');
    return res.data;
  },
  async getStats() {
    const res = await api.get('/challenges/stats');
    return res.data;
  },
  async create(data: any) {
    const res = await api.post('/challenges', data);
    return res.data;
  },
  async participate(id: string) {
    const res = await api.post(`/challenges/${id}/participate`);
    return res.data;
  },
  async complete(id: string) {
    const res = await api.post(`/challenges/${id}/complete`);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/challenges/${id}`);
    return res.data;
  },
};