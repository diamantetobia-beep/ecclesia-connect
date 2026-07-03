import { api } from './api';

export const eventService = {
  async getAll() {
    const res = await api.get('/events');
    return res.data;
  },
  async getOne(id: string) {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },
  async create(data: any) {
    const res = await api.post('/events', data);
    return res.data;
  },
  async update(id: string, data: any) {
    const res = await api.patch(`/events/${id}`, data);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },
  async register(id: string) {
    const res = await api.post(`/events/${id}/register`);
    return res.data;
  },
  async unregister(id: string) {
    const res = await api.delete(`/events/${id}/unregister`);
    return res.data;
  },
};