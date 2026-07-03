import { api } from './api';

export const postService = {
  async getAll() {
    const token = localStorage.getItem('token');
    const res = await api.get('/posts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};