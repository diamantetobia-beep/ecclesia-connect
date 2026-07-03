import { api } from './api';

export const gameService = {
  // Récupérer tous les jeux (si nécessaire)
  async getAll() {
    const res = await api.get('/games');
    return res.data;
  },

  // Récupérer un jeu spécifique
  async getOne(id: string) {
    const res = await api.get(`/games/${id}`);
    return res.data;
  },

  // Créer un jeu (admin)
  async create(data: any) {
    const res = await api.post('/games', data);
    return res.data;
  },

  // Mettre à jour un jeu
  async update(id: string, data: any) {
    const res = await api.patch(`/games/${id}`, data);
    return res.data;
  },

  // Supprimer un jeu
  async delete(id: string) {
    const res = await api.delete(`/games/${id}`);
    return res.data;
  },

  // S'inscrire à un jeu (si applicable)
  async register(id: string) {
    const res = await api.post(`/games/${id}/register`);
    return res.data;
  },

  // Se désinscrire
  async unregister(id: string) {
    const res = await api.delete(`/games/${id}/unregister`);
    return res.data;
  },

  // ---------- CLASSEMENT MENSUEL ----------
  async getLeaderboard(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const res = await api.get(`/games/leaderboard?${params.toString()}`);
    return res.data;
  },
};