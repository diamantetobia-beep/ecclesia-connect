import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadingPlansService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UN PLAN ----------
  async create(userId: string, data: any) {
    const { title, description, type, frequency, verses } = data;
    if (!title || !type || !frequency || !verses || !Array.isArray(verses) || verses.length === 0) {
      throw new BadRequestException('Titre, type, fréquence et une liste de versets sont requis.');
    }

    return this.prisma.readingPlan.create({
      data: {
        title,
        description,
        type,
        frequency,
        verses: JSON.stringify(verses),
        totalItems: verses.length,
        userId,
        isActive: true,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ---------- LISTER LES PLANS ACTIFS ----------
  async findAll() {
    return this.prisma.readingPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: { progress: true },
        },
      },
    });
  }

  // ---------- DÉTAIL D'UN PLAN ----------
  async findOne(id: string, userId?: string) {
    const plan = await this.prisma.readingPlan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        progress: {
          where: { userId: userId || undefined },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan introuvable.');
    return plan;
  }

  // ---------- PROGRESSION UTILISATEUR ----------
  async getMyProgress(userId: string) {
    const progress = await this.prisma.readingProgress.findMany({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return progress.map((p) => ({
      ...p,
      progressPercent: Math.round((p.currentIndex / (p.plan.totalItems || 1)) * 100),
      remaining: p.plan.totalItems - p.currentIndex,
    }));
  }

  // ---------- LIRE LE VERSET SUIVANT ----------
  async readNext(planId: string, userId: string) {
    const plan = await this.prisma.readingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan introuvable.');

    let progress = await this.prisma.readingProgress.findFirst({
      where: { planId, userId },
    });

    if (!progress) {
      progress = await this.prisma.readingProgress.create({
        data: {
          planId,
          userId,
          currentIndex: 0,
        },
      });
    }

    if (progress.currentIndex >= plan.totalItems) {
      throw new BadRequestException('Vous avez déjà terminé ce plan.');
    }

    // Récupérer le verset actuel
    const verses = JSON.parse(plan.verses as string);
    const currentVerse = verses[progress.currentIndex] || '';

    // Incrémenter l'index
    const updated = await this.prisma.readingProgress.update({
      where: { id: progress.id },
      data: {
        currentIndex: progress.currentIndex + 1,
        lastReadAt: new Date(),
        completedAt: progress.currentIndex + 1 >= plan.totalItems ? new Date() : undefined,
      },
    });

    return {
      verse: currentVerse,
      progress: updated,
      isCompleted: updated.currentIndex >= plan.totalItems,
      total: plan.totalItems,
      remaining: plan.totalItems - updated.currentIndex,
    };
  }

  // ---------- RÉINITIALISER UN PLAN ----------
  async resetProgress(planId: string, userId: string) {
    const progress = await this.prisma.readingProgress.findFirst({
      where: { planId, userId },
    });
    if (!progress) throw new NotFoundException('Progression introuvable.');

    return this.prisma.readingProgress.update({
      where: { id: progress.id },
      data: {
        currentIndex: 0,
        completedAt: null,
        lastReadAt: null,
      },
    });
  }

  // ---------- STATISTIQUES UTILISATEUR ----------
  async getUserStats(userId: string) {
    const allProgress = await this.prisma.readingProgress.findMany({
      where: { userId },
      include: { plan: true },
    });

    const totalPlans = allProgress.length;
    const completedPlans = allProgress.filter(p => p.completedAt).length;
    const totalVersesRead = allProgress.reduce((acc, p) => acc + p.currentIndex, 0);

    // Dernière lecture
    const lastRead = allProgress
      .filter(p => p.lastReadAt)
      .sort((a, b) => b.lastReadAt!.getTime() - a.lastReadAt!.getTime())[0];

    // Lecture du jour (plan quotidien)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPlan = await this.prisma.readingPlan.findFirst({
      where: {
        isActive: true,
        frequency: 'daily',
      },
      include: {
        progress: {
          where: { userId },
        },
      },
    });

    const dailyProgress = dailyPlan?.progress?.[0];
    const hasReadToday = dailyProgress?.lastReadAt
      ? new Date(dailyProgress.lastReadAt).setHours(0, 0, 0, 0) >= today.getTime()
      : false;

    return {
      totalPlans,
      completedPlans,
      totalVersesRead,
      lastRead: lastRead?.lastReadAt || null,
      hasReadToday,
      dailyPlan: dailyPlan
        ? {
            ...dailyPlan,
            currentIndex: dailyProgress?.currentIndex || 0,
            totalItems: dailyPlan.totalItems,
            remaining: dailyPlan.totalItems - (dailyProgress?.currentIndex || 0),
            progressPercent: dailyProgress
              ? Math.round((dailyProgress.currentIndex / dailyPlan.totalItems) * 100)
              : 0,
          }
        : null,
    };
  }

  // ---------- SUPPRIMER UN PLAN ----------
  async remove(id: string, userId: string) {
    const plan = await this.prisma.readingPlan.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!plan) throw new NotFoundException('Plan introuvable.');

    // Seul le créateur ou un admin peut supprimer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (plan.userId !== userId && user?.role?.name !== 'Super Admin') {
      throw new ForbiddenException('Seul le créateur ou un admin peut supprimer ce plan.');
    }

    // Supprimer les progressions associées
    await this.prisma.readingProgress.deleteMany({
      where: { planId: id },
    });

    return this.prisma.readingPlan.delete({ where: { id } });
  }

  // ---------- VERSET DU JOUR ----------
  async getVerseOfTheDay() {
    // Prendre un plan actif (quotidien) et retourner le verset du jour
    const dailyPlan = await this.prisma.readingPlan.findFirst({
      where: {
        isActive: true,
        frequency: 'daily',
      },
    });

    if (!dailyPlan) {
      // Fallback : verset aléatoire de la Bible
      const count = await this.prisma.bibleVerse.count();
      if (count === 0) {
        return { verse: 'La Bible est en cours de chargement.', reference: '' };
      }
      const skip = Math.floor(Math.random() * count);
      const verse = await this.prisma.bibleVerse.findFirst({
        skip,
        take: 1,
        include: { book: true },
      });
      return {
        verse: verse?.text || '',
        reference: verse ? `${verse.book.nameFr} ${verse.chapter}:${verse.verse}` : '',
      };
    }

    const verses = JSON.parse(dailyPlan.verses as string);
    // Sélectionner un verset en fonction du jour (ex: jour de l'année)
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % verses.length;
    const verseRef = verses[index] || '';

    // Récupérer le texte du verset (optionnel)
    let verseText = '';
    let reference = verseRef;

    // Essayer de récupérer le texte depuis la Bible
    try {
      const parts = verseRef.split(' ');
      const bookName = parts.slice(0, parts.length - 1).join(' ');
      const chapterVerse = parts[parts.length - 1];
      if (chapterVerse) {
        const [chapter, verse] = chapterVerse.split(':').map(Number);
        if (bookName && chapter && verse) {
          const bibleVerse = await this.prisma.bibleVerse.findFirst({
            where: {
              book: { nameFr: { contains: bookName } },
              chapter,
              verse,
            },
            include: { book: true },
          });
          if (bibleVerse) {
            verseText = bibleVerse.text;
          }
        }
      }
    } catch (e) {
      // Si on ne trouve pas, on garde juste la référence
    }

    return {
      verse: verseText || '📖 Lis ta Bible aujourd\'hui.',
      reference: verseRef,
    };
  }
}