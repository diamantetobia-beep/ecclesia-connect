import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UN DÉFI ----------
  async create(userId: string, data: any) {
    const { title, description, type, frequency, points, category } = data;
    if (!title || !description || !type || !frequency) {
      throw new BadRequestException('Titre, description, type et fréquence requis.');
    }

    return this.prisma.challenge.create({
      data: {
        title,
        description,
        type,
        frequency,
        points: points || 10,
        category,
        isActive: true,
      },
    });
  }

  // ---------- LISTER TOUS LES DÉFIS ----------
  async findAll() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        participations: true,
        _count: {
          select: { participations: true },
        },
      },
    });
  }

  // ---------- DÉTAIL D'UN DÉFI ----------
  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        participations: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable.');
    return challenge;
  }

  // ---------- PARTICIPER À UN DÉFI ----------
  async participate(challengeId: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable.');

    const existing = await this.prisma.challengeParticipation.findFirst({
      where: { challengeId, userId },
    });
    if (existing) {
      throw new BadRequestException('Vous participez déjà à ce défi.');
    }

    return this.prisma.challengeParticipation.create({
      data: {
        challengeId,
        userId,
      },
      include: { challenge: true },
    });
  }

  // ---------- MARQUER COMME COMPLÉTÉ ----------
  async complete(challengeId: string, userId: string) {
    const participation = await this.prisma.challengeParticipation.findFirst({
      where: { challengeId, userId },
      include: { challenge: true },
    });
    if (!participation) {
      throw new BadRequestException('Vous ne participez pas à ce défi.');
    }
    if (participation.completedAt) {
      throw new BadRequestException('Vous avez déjà complété ce défi.');
    }

    return this.prisma.challengeParticipation.update({
      where: { id: participation.id },
      data: { completedAt: new Date() },
      include: { challenge: true },
    });
  }

  // ---------- STATISTIQUES UTILISATEUR ----------
  async getUserStats(userId: string) {
    const participations = await this.prisma.challengeParticipation.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: 'desc' },
    });

    const completed = participations.filter(p => p.completedAt);
    const totalPoints = completed.reduce((acc, p) => acc + (p.challenge.points || 0), 0);

    // Défis du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyChallenges = await this.prisma.challenge.findMany({
      where: {
        isActive: true,
        frequency: 'daily',
      },
      include: {
        participations: {
          where: { userId },
        },
      },
    });

    // Vérifier si complété aujourd'hui
    const todayCompleted = await this.prisma.challengeParticipation.findFirst({
      where: {
        userId,
        completedAt: {
          gte: today,
        },
      },
    });

    return {
      totalParticipations: participations.length,
      totalCompleted: completed.length,
      totalPoints,
      hasCompletedToday: !!todayCompleted,
      dailyChallenges: dailyChallenges.map(c => ({
        ...c,
        isCompleted: c.participations.some(p => p.completedAt && p.completedAt >= today),
        isParticipating: c.participations.length > 0,
      })),
      recentParticipations: participations.slice(0, 10),
    };
  }

  // ---------- SUPPRIMER UN DÉFI ----------
  async remove(id: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Défi introuvable.');

    // Seul l'admin peut supprimer un défi
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (user?.role?.name !== 'Super Admin') {
      throw new ForbiddenException('Seul un administrateur peut supprimer un défi.');
    }

    // Supprimer les participations associées
    await this.prisma.challengeParticipation.deleteMany({
      where: { challengeId: id },
    });

    return this.prisma.challenge.delete({ where: { id } });
  }

  // ---------- DÉFI DU JOUR (aléatoire) ----------
  async getDailyChallenge(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Voir si l'utilisateur a déjà complété un défi aujourd'hui
    const todayCompleted = await this.prisma.challengeParticipation.findFirst({
      where: {
        userId,
        completedAt: {
          gte: today,
        },
      },
      include: { challenge: true },
    });

    if (todayCompleted) {
      return {
        challenge: todayCompleted.challenge,
        completed: true,
        completedAt: todayCompleted.completedAt,
      };
    }

    // Récupérer les défis quotidiens actifs
    const dailyChallenges = await this.prisma.challenge.findMany({
      where: {
        isActive: true,
        frequency: 'daily',
      },
    });

    if (dailyChallenges.length === 0) {
      return null;
    }

    // Choisir un défi aléatoire (ou le même pour tous les membres selon la date)
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % dailyChallenges.length;
    const challenge = dailyChallenges[index];

    return {
      challenge,
      completed: false,
      completedAt: null,
    };
  }
  // ---------- DÉFI DU JOUR (pour le Dashboard) ----------
// ---------- DÉFI DU JOUR ----------
async getTodayChallenge(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Vérifier si l'utilisateur a déjà complété un défi aujourd'hui
  const completedToday = await this.prisma.challengeParticipation.findFirst({
    where: {
      userId,
      completedAt: {
        gte: today,
      },
    },
    include: { challenge: true },
  });

  if (completedToday) {
    return {
      challenge: completedToday.challenge,
      completed: true,
      completedAt: completedToday.completedAt,
    };
  }

  // Récupérer un défi quotidien aléatoire
  const dailyChallenges = await this.prisma.challenge.findMany({
    where: { isActive: true, frequency: 'daily' },
  });

  if (dailyChallenges.length === 0) {
    return null;
  }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % dailyChallenges.length;
  const challenge = dailyChallenges[index];

  return {
    challenge,
    completed: false,
    completedAt: null,
  };
}
}