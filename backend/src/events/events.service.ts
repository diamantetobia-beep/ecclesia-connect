import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UN ÉVÉNEMENT ----------
  async create(userId: string, data: any) {
    const { title, description, location, startDate, endDate, type } = data;
    if (!title || !startDate || !endDate) {
      throw new BadRequestException('Titre, date début et date fin requis.');
    }
    return this.prisma.event.create({
      data: {
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || 'autre',
        createdBy: userId,
      },
      include: { creator: true },
    });
  }

  // ---------- LISTE TOUS LES ÉVÉNEMENTS ----------
  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
  }

  // ---------- DÉTAIL D'UN ÉVÉNEMENT ----------
  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!event) throw new BadRequestException('Événement introuvable.');
    return event;
  }

  // ---------- MISE À JOUR ----------
  async update(id: string, userId: string, data: any) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new BadRequestException('Événement introuvable.');
    if (event.createdBy !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas le créateur de cet événement.');
    }
    return this.prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        type: data.type,
      },
      include: { creator: true },
    });
  }

  // ---------- SUPPRIMER ----------
  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new BadRequestException('Événement introuvable.');
    if (event.createdBy !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas le créateur de cet événement.');
    }
    return this.prisma.event.delete({ where: { id } });
  }

  // ---------- S'INSCRIRE À UN ÉVÉNEMENT ----------
  async register(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new BadRequestException('Événement introuvable.');

    const existing = await this.prisma.eventParticipant.findFirst({
      where: { eventId, userId },
    });
    if (existing) {
      throw new BadRequestException('Vous êtes déjà inscrit à cet événement.');
    }

    return this.prisma.eventParticipant.create({
      data: { eventId, userId },
    });
  }

  // ---------- SE DÉSINSCRIRE ----------
  async unregister(eventId: string, userId: string) {
    const participant = await this.prisma.eventParticipant.findFirst({
      where: { eventId, userId },
    });
    if (!participant) {
      throw new BadRequestException('Vous n\'êtes pas inscrit à cet événement.');
    }
    return this.prisma.eventParticipant.delete({ where: { id: participant.id } });
  }
}
