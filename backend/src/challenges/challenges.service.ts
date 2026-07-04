import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './create-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, frequency?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (frequency) where.frequency = frequency;

    const challenges = await this.prisma.challenge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        participations: { select: { id: true } },
      },
    });

    return challenges.map((c) => ({
      ...c,
      _count: { participations: c.participations.length },
    }));
  }

  async getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let challenge = await this.prisma.challenge.findFirst({
      where: { isDaily: true, date: today, isActive: true },
      include: { participations: true },
    });

    if (!challenge) {
      challenge = await this.prisma.challenge.findFirst({
        where: { isDaily: true, date: null, isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { participations: true },
      });
    }

    if (!challenge) {
      const count = await this.prisma.challenge.count({ where: { isActive: true } });
      if (count === 0) return null;
      const skip = Math.floor(Math.random() * count);
      challenge = await this.prisma.challenge.findFirst({
        where: { isActive: true },
        skip,
        take: 1,
        include: { participations: true },
      });
    }

    return challenge;
  }

  async create(createChallengeDto: CreateChallengeDto) {
    const { isDaily, date, ...rest } = createChallengeDto;
    const parsedDate = date ? new Date(date) : null;
    if (parsedDate) parsedDate.setHours(0, 0, 0, 0);

    return this.prisma.challenge.create({
      data: {
        ...rest, // contient title, description, type, frequency, points, category
        isDaily: isDaily || false,
        date: parsedDate,
      },
    });
  }

  async participate(challengeId: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');

    const existing = await this.prisma.challengeParticipation.findFirst({
      where: { userId, challengeId },
    });
    if (existing) return { message: 'Déjà participé' };

    await this.prisma.challengeParticipation.create({
      data: { userId, challengeId },
    });
    return { message: 'Participation enregistrée' };
  }

  async complete(challengeId: string, userId: string) {
    const participation = await this.prisma.challengeParticipation.findFirst({
      where: { userId, challengeId },
    });
    if (!participation) throw new NotFoundException('Vous ne participez pas à ce défi');
    if (participation.completedAt) return { message: 'Défi déjà complété' };

    await this.prisma.challengeParticipation.update({
      where: { id: participation.id },
      data: { completedAt: new Date() },
    });
    return { message: 'Défi complété avec succès' };
  }

  async getUserStats(userId: string) {
    const participations = await this.prisma.challengeParticipation.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const completed = participations.filter((p) => p.completedAt !== null);
    const totalPoints = completed.reduce(
      (acc, p) => acc + (p.challenge?.points || 0),
      0,
    );
    return {
      recentParticipations: participations,
      totalCompleted: completed.length,
      totalPoints,
    };
  }
}