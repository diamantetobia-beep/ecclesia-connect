import { api } from './api';

export const readingPlanService = {
  async getAll() {
    const res = await api.get('/reading-plans');
    return res.data;
  },
  async getOne(id: string) {
    const res = await api.get(`/reading-plans/${id}`);
    return res.data;
  },
  async getMyProgress() {
    const res = await api.get('/reading-plans/my-progress');
    return res.data;
  },
  async getStats() {
    const res = await api.get('/reading-plans/stats');
    return res.data;
  },
  async getVerseOfTheDay() {
    const res = await api.get('/reading-plans/verse-of-the-day');
    return res.data;
  },
  async create(data: any) {
    const res = await api.post('/reading-plans', data);
    return res.data;
  },
  async readNext(id: string) {
    const res = await api.post(`/reading-plans/${id}/read-next`);
    return res.data;
  },
  async reset(id: string) {
    const res = await api.post(`/reading-plans/${id}/reset`);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/reading-plans/${id}`);
    return res.data;
  },
};