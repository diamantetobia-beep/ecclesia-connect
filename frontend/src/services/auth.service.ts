import { api } from './api';

export const authService = {
  async register(email: string, password: string, firstName: string, lastName: string, photoUrl?: string) {
    const response = await api.post('/auth/register', { email, password, firstName, lastName, photoUrl });
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async getProfile() {
    const token = localStorage.getItem('token');
    const response = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateProfile(data: any) {
    const token = localStorage.getItem('token');
    const response = await api.patch('/auth/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getUsers() {
    const token = localStorage.getItem('token');
    const response = await api.get('/auth/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async activateUser(userId: string) {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/auth/admin/users/${userId}/activate`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async rejectUser(userId: string) {
    const token = localStorage.getItem('token');
    const response = await api.delete(`/auth/admin/users/${userId}/reject`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};