import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrayersService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UNE DEMANDE ----------
  async create(userId: string, data: { title: string; content: string }) {
    if (!data.title || !data.content) {
      throw new BadRequestException('Titre et contenu requis.');
    }
    return this.prisma.prayerRequest.create({
      data: {
        title: data.title,
        content: data.content,
        userId,
      },
      include: { user: true },
    });
  }

  // ---------- LISTER TOUTES LES DEMANDES ----------
  async findAll() {
    return this.prisma.prayerRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        comments: true,
        reactions: true,
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });
  }

  // ---------- DÉTAIL D'UNE DEMANDE ----------
  async findOne(id: string) {
    const prayer = await this.prisma.prayerRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        comments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        reactions: {
          include: { user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
      },
    });
    if (!prayer) throw new NotFoundException('Demande introuvable.');
    return prayer;
  }

  // ---------- AJOUTER UN COMMENTAIRE ----------
  async addComment(requestId: string, userId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Commentaire requis.');
    }
    const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: requestId } });
    if (!prayer) throw new NotFoundException('Demande introuvable.');

    return this.prisma.prayerComment.create({
      data: {
        content,
        userId,
        requestId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
    });
  }

  // ---------- AJOUTER/RETIRER UNE RÉACTION (Je prie pour toi) ----------
  async togglePray(requestId: string, userId: string) {
    const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: requestId } });
    if (!prayer) throw new NotFoundException('Demande introuvable.');

    const existing = await this.prisma.prayerReaction.findFirst({
      where: { requestId, userId },
    });

    if (existing) {
      // Retirer la réaction
      await this.prisma.prayerReaction.delete({ where: { id: existing.id } });
      return { message: '🙏 Prière retirée.' };
    } else {
      // Ajouter la réaction
      await this.prisma.prayerReaction.create({
        data: { requestId, userId },
      });
      return { message: '🙏 Vous priez pour cette demande.' };
    }
  }

  // ---------- MARQUER COMME EXAUCÉE ----------
  async markAnswered(requestId: string, userId: string) {
    const prayer = await this.prisma.prayerRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    if (!prayer) throw new NotFoundException('Demande introuvable.');

    // Seul l'auteur ou un admin peut marquer comme exaucée
    const isAuthor = prayer.userId === userId;
    const isAdmin = await this.prisma.user.findUnique({
      where: { id: userId, role: { name: 'Super Admin' } },
    });

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Seul l\'auteur ou un administrateur peut marquer comme exaucée.');
    }

    return this.prisma.prayerRequest.update({
      where: { id: requestId },
      data: { isAnswered: !prayer.isAnswered },
    });
  }

  // ---------- SUPPRIMER UNE DEMANDE ----------
  async remove(requestId: string, userId: string) {
    const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: requestId } });
    if (!prayer) throw new NotFoundException('Demande introuvable.');

    const isAuthor = prayer.userId === userId;
    const isAdmin = await this.prisma.user.findUnique({
      where: { id: userId, role: { name: 'Super Admin' } },
    });

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Seul l\'auteur ou un administrateur peut supprimer cette demande.');
    }

    // Supprimer les commentaires et réactions associés
    await this.prisma.prayerComment.deleteMany({ where: { requestId } });
    await this.prisma.prayerReaction.deleteMany({ where: { requestId } });

    return this.prisma.prayerRequest.delete({ where: { id: requestId } });
  }
}