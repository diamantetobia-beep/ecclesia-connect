import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // Membres actifs
    const totalMembers = await this.prisma.user.count({
      where: { isActive: true },
    });

    // Ateliers actifs
    const totalWorkshops = await this.prisma.workshop.count();

    // Demandes de prière (non exaucées)
    const totalPrayers = await this.prisma.prayerRequest.count({
      where: { isAnswered: false },
    });

    // Événements à venir (à partir d'aujourd'hui)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalUpcomingEvents = await this.prisma.event.count({
      where: {
        startDate: {
          gte: today,
        },
      },
    });

    // Publications (dernières 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const totalPosts = await this.prisma.post.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Défis complétés (tous les utilisateurs, ce mois-ci)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const totalCompletedChallenges = await this.prisma.challengeParticipation.count({
      where: {
        completedAt: {
          gte: startOfMonth,
        },
      },
    });

    // Jeux joués (ce mois-ci)
    const totalGamesPlayed = await this.prisma.bibleGameAttempt.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return {
      members: totalMembers,
      workshops: totalWorkshops,
      prayers: totalPrayers,
      upcomingEvents: totalUpcomingEvents,
      posts: totalPosts,
      completedChallenges: totalCompletedChallenges,
      gamesPlayed: totalGamesPlayed,
    };
  }

  // ---------- STATISTIQUES DÉTAILLÉES (pour l'admin) ----------
  async getAdminStats() {
    const [
      totalMembers,
      activeMembers,
      totalWorkshops,
      totalPrayers,
      answeredPrayers,
      totalEvents,
      totalPosts,
      totalComments,
      totalGames,
      totalChallenges,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.workshop.count(),
      this.prisma.prayerRequest.count(),
      this.prisma.prayerRequest.count({ where: { isAnswered: true } }),
      this.prisma.event.count(),
      this.prisma.post.count(),
      this.prisma.comment.count(),
      this.prisma.bibleGameAttempt.count(),
      this.prisma.challenge.count(),
    ]);

    // Membres par rôle
    const membersByRole = await this.prisma.role.findMany({
      select: {
        name: true,
        _count: {
          select: { users: true },
        },
      },
    });

    // Activité des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      take: 10,
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers,
        byRole: membersByRole,
      },
      workshops: totalWorkshops,
      prayers: {
        total: totalPrayers,
        answered: answeredPrayers,
        pending: totalPrayers - answeredPrayers,
      },
      events: totalEvents,
      posts: totalPosts,
      comments: totalComments,
      games: totalGames,
      challenges: totalChallenges,
      recentActivity,
    };
  }
}