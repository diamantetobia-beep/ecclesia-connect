import { api } from './api';

export const statsService = {
  async getDashboard() {
    try {
      const res = await api.get('/stats/dashboard');
      return res.data;
    } catch (error) {
      console.error('Erreur stats dashboard:', error);
      // Retourner des valeurs par défaut pour que l'UI ne plante pas
      return { members: 0, workshops: 0, prayers: 0, upcomingEvents: 0, posts: 0 };
    }
  },

  async getAdmin() {
    try {
      const res = await api.get('/stats/admin');
      return res.data;
    } catch (error) {
      console.error('Erreur stats admin:', error);
      return {
        members: { total: 0, active: 0, inactive: 0, byRole: [] },
        workshops: 0,
        prayers: { total: 0, answered: 0, pending: 0 },
        events: 0,
        posts: 0,
        comments: 0,
        recentActivity: [],
      };
    }
  },
};