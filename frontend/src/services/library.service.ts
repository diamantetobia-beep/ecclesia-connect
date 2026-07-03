import { api } from './api';

export const libraryService = {
  async getAll(filters?: { type?: string; category?: string }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    const res = await api.get(`/library?${params.toString()}`);
    return res.data;
  },
  async getAllAdmin() {
    const res = await api.get('/library/admin');
    return res.data;
  },
  async getOne(id: string) {
    const res = await api.get(`/library/${id}`);
    return res.data;
  },
  async create(data: any) {
    const res = await api.post('/library', data);
    return res.data;
  },
  async update(id: string, data: any) {
    const res = await api.patch(`/library/${id}`, data);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/library/${id}`);
    return res.data;
  },
  async getTypes() {
    const res = await api.get('/library/types');
    return res.data;
  },
  async getCategories() {
    const res = await api.get('/library/categories');
    return res.data;
  },
};