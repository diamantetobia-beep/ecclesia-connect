import axios, { AxiosInstance } from 'axios';

// Configuration de l'instance Axios
const api: AxiosInstance = axios.create({
  baseURL: '/api', // Proxy Vite vers le backend (ex: http://localhost:3000)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types pour les données
export interface CreateChallengeData {
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  frequency: 'daily' | 'weekly';
  points?: number;
  category?: string;
  isDaily?: boolean;
  date?: string; // YYYY-MM-DD
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  points: number;
  category: string | null;
  isActive: boolean;
  isDaily: boolean;
  date: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { participations: number };
}

export interface Participation {
  id: string;
  userId: string;
  challengeId: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  challenge: Challenge;
}

export const challengeService = {
  /**
   * Récupère tous les défis actifs avec filtres optionnels
   */
  async getAll(filters?: { category?: string; frequency?: string }): Promise<Challenge[]> {
    const response = await api.get('/challenges', { params: filters });
    return response.data;
  },

  /**
   * Récupère le défi du jour
   */
  async getToday(): Promise<Challenge | null> {
    const response = await api.get('/challenges/today');
    return response.data;
  },

  /**
   * Récupère les statistiques de l'utilisateur connecté
   */
  async getStats(): Promise<{ recentParticipations: Participation[]; totalCompleted: number; totalPoints: number }> {
    const response = await api.get('/challenges/stats');
    return response.data;
  },

  /**
   * Crée un nouveau défi (réservé aux superadmins)
   */
  async create(data: CreateChallengeData): Promise<Challenge> {
    const response = await api.post('/challenges', data);
    return response.data;
  },

  /**
   * Participe à un défi
   */
  async participate(challengeId: string): Promise<{ message: string }> {
    const response = await api.post(`/challenges/${challengeId}/participate`);
    return response.data;
  },

  /**
   * Marque un défi comme complété
   */
  async complete(challengeId: string): Promise<{ message: string }> {
    const response = await api.post(`/challenges/${challengeId}/complete`);
    return response.data;
  },
};