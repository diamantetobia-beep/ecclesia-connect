import { api } from './api';

export const workshopService = {
  async getAll() {
    const res = await api.get('/workshops');
    return res.data;
  },
  async getOne(id: string) {
    const res = await api.get(`/workshops/${id}`);
    return res.data;
  },
  async create(data: any) {
    const res = await api.post('/workshops', data);
    return res.data;
  },
  async update(id: string, data: any) {
    const res = await api.patch(`/workshops/${id}`, data);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/workshops/${id}`);
    return res.data;
  },
  async join(id: string) {
    const res = await api.post(`/workshops/${id}/join`);
    return res.data;
  },
  async leave(id: string) {
    const res = await api.post(`/workshops/${id}/leave`);
    return res.data;
  },
  async approve(workshopId: string, userId: string) {
    const res = await api.post(`/workshops/${workshopId}/approve/${userId}`);
    return res.data;
  },
  async reject(workshopId: string, userId: string) {
    const res = await api.post(`/workshops/${workshopId}/reject/${userId}`);
    return res.data;
  },
  async sendChat(workshopId: string, message: string, fileUrl?: string, fileType?: string) {
  const res = await api.post(`/workshops/${workshopId}/chat`, { message, fileUrl, fileType });
  return res.data;
},
  async addSchedule(workshopId: string, data: any) {
    const res = await api.post(`/workshops/${workshopId}/schedule`, data);
    return res.data;
  },
  async addArchive(workshopId: string, data: any) {
    const res = await api.post(`/workshops/${workshopId}/archive`, data);
    return res.data;
  },
  async deleteArchive(archiveId: string) {
    const res = await api.delete(`/workshops/archive/${archiveId}`);
    return res.data;
  },
  async deleteSchedule(scheduleId: string) {
  const res = await api.delete(`/workshops/schedule/${scheduleId}`);
  return res.data;
},
async getPendingRequests(workshopId: string) {
  const res = await api.get(`/workshops/${workshopId}/pending`);
  return res.data;
},
};