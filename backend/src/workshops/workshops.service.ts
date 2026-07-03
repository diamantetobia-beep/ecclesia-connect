import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkshopsService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UN ATELIER ----------
  async create(userId: string, data: any) {
    const { name, description, category, imageUrl, leaderId } = data;
    if (!name || !category) {
      throw new BadRequestException('Nom et catégorie requis.');
    }

    // Vérifier que le leader existe
    if (leaderId) {
      const leader = await this.prisma.user.findUnique({
        where: { id: leaderId },
      });
      if (!leader) {
        throw new BadRequestException('Responsable introuvable.');
      }
    }

    // Créer l'atelier
    const workshop = await this.prisma.workshop.create({
      data: {
        name,
        description,
        category,
        imageUrl,
        leaderId: leaderId || userId,
      },
      include: { leader: true },
    });

    // ✅ Ajouter automatiquement le leader comme membre approuvé
    await this.prisma.workshopMember.create({
      data: {
        workshopId: workshop.id,
        userId: workshop.leaderId,
        status: 'approved',
      },
    });

    return workshop;
  }

  // ---------- LISTER TOUS LES ATELIERS ----------
  async findAll() {
    return this.prisma.workshop.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        leader: { select: { id: true, firstName: true, lastName: true, email: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  // ---------- DÉTAIL D'UN ATELIER ----------
  async findOne(id: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, firstName: true, lastName: true, email: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        chat: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        schedules: { orderBy: { date: 'asc' } },
        archives: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    return workshop;
  }

  // ---------- MODIFIER UN ATELIER ----------
  async update(id: string, userId: string, data: any) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== userId) {
      throw new ForbiddenException('Seul le responsable peut modifier cet atelier.');
    }

    // ✅ Si le leader change, ajouter le nouveau leader comme membre approuvé
    if (data.leaderId && data.leaderId !== workshop.leaderId) {
      const newLeader = await this.prisma.user.findUnique({
        where: { id: data.leaderId },
      });
      if (!newLeader) {
        throw new BadRequestException('Nouveau responsable introuvable.');
      }

      // Vérifier si l'utilisateur est déjà membre
      const existing = await this.prisma.workshopMember.findFirst({
        where: { workshopId: id, userId: data.leaderId },
      });

      if (!existing) {
        // Ajouter comme membre approuvé
        await this.prisma.workshopMember.create({
          data: {
            workshopId: id,
            userId: data.leaderId,
            status: 'approved',
          },
        });
      } else if (existing.status !== 'approved') {
        // Si déjà membre avec un autre statut (pending/rejected), le passer à approved
        await this.prisma.workshopMember.update({
          where: { id: existing.id },
          data: { status: 'approved' },
        });
      }
    }

    // Mettre à jour l'atelier
    return this.prisma.workshop.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        imageUrl: data.imageUrl,
        leaderId: data.leaderId,
      },
      include: { leader: true },
    });
  }

  // ---------- SUPPRIMER UN ATELIER ----------
  async remove(id: string, userId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== userId) {
      throw new ForbiddenException('Seul le responsable peut supprimer cet atelier.');
    }

    // Supprimer toutes les dépendances
    await this.prisma.workshopMember.deleteMany({ where: { workshopId: id } });
    await this.prisma.workshopChat.deleteMany({ where: { workshopId: id } });
    await this.prisma.workshopSchedule.deleteMany({ where: { workshopId: id } });
    await this.prisma.workshopArchive.deleteMany({ where: { workshopId: id } });

    return this.prisma.workshop.delete({ where: { id } });
  }

  // ---------- DEMANDER À REJOINDRE ----------
  async requestJoin(workshopId: string, userId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');

    const existing = await this.prisma.workshopMember.findFirst({
      where: { workshopId, userId },
    });
    if (existing) {
      if (existing.status === 'pending') {
        throw new BadRequestException('Demande déjà en attente.');
      }
      if (existing.status === 'approved') {
        throw new BadRequestException('Vous êtes déjà membre de cet atelier.');
      }
      if (existing.status === 'rejected') {
        // Réactiver la demande si elle a été rejetée
        return this.prisma.workshopMember.update({
          where: { id: existing.id },
          data: { status: 'pending' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        });
      }
    }

    return this.prisma.workshopMember.create({
      data: { workshopId, userId, status: 'pending' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ---------- VALIDER UNE DEMANDE ----------
  async approveMember(workshopId: string, userId: string, leaderId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Seul le responsable peut valider les membres.');
    }

    const member = await this.prisma.workshopMember.findFirst({
      where: { workshopId, userId },
    });
    if (!member) throw new NotFoundException('Demande introuvable.');

    return this.prisma.workshopMember.update({
      where: { id: member.id },
      data: { status: 'approved' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  // ---------- REJETER UNE DEMANDE ----------
  async rejectMember(workshopId: string, userId: string, leaderId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Seul le responsable peut rejeter les membres.');
    }

    const member = await this.prisma.workshopMember.findFirst({
      where: { workshopId, userId },
    });
    if (!member) throw new NotFoundException('Demande introuvable.');

    return this.prisma.workshopMember.update({
      where: { id: member.id },
      data: { status: 'rejected' },
    });
  }

  // ---------- QUITTER UN ATELIER ----------
  async leave(workshopId: string, userId: string) {
    // Le leader ne peut pas quitter son atelier
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (workshop && workshop.leaderId === userId) {
      throw new BadRequestException('Le responsable ne peut pas quitter son atelier.');
    }

    const member = await this.prisma.workshopMember.findFirst({
      where: { workshopId, userId, status: 'approved' },
    });
    if (!member) throw new BadRequestException('Vous n\'êtes pas membre de cet atelier.');

    return this.prisma.workshopMember.delete({ where: { id: member.id } });
  }

  // ---------- AJOUTER UN MESSAGE DANS LE CHAT ----------
  async addChat(workshopId: string, userId: string, message: string, fileUrl?: string, fileType?: string) {
    if (!message && !fileUrl) {
      throw new BadRequestException('Message ou fichier requis.');
    }

    const member = await this.prisma.workshopMember.findFirst({
      where: { workshopId, userId, status: 'approved' },
    });
    if (!member) {
      throw new ForbiddenException('Vous devez être membre approuvé pour parler.');
    }

    return this.prisma.workshopChat.create({
      data: {
        workshopId,
        userId,
        message: message || '',
        fileUrl,
        fileType,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ---------- AJOUTER UN PLANNING ----------
  async addSchedule(workshopId: string, leaderId: string, data: any) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Seul le responsable peut ajouter un planning.');
    }

    return this.prisma.workshopSchedule.create({
      data: {
        workshopId,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
      },
    });
  }

  // ---------- SUPPRIMER UN PLANNING ----------
  async removeSchedule(scheduleId: string, leaderId: string) {
    const schedule = await this.prisma.workshopSchedule.findUnique({
      where: { id: scheduleId },
      include: { workshop: true },
    });
    if (!schedule) throw new NotFoundException('Planning introuvable.');
    if (schedule.workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Seul le responsable peut supprimer un planning.');
    }
    return this.prisma.workshopSchedule.delete({ where: { id: scheduleId } });
  }

  // ---------- AJOUTER UNE ARCHIVE ----------
  async addArchive(workshopId: string, leaderId: string, data: any) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Seul le responsable peut ajouter une archive.');
    }

    return this.prisma.workshopArchive.create({
      data: {
        workshopId,
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        type: data.type,
      },
    });
  }

  // ---------- SUPPRIMER UNE ARCHIVE ----------
  async removeArchive(archiveId: string, leaderId: string) {
    const archive = await this.prisma.workshopArchive.findUnique({
      where: { id: archiveId },
      include: { workshop: true },
    });
    if (!archive) throw new NotFoundException('Archive introuvable.');
    if (archive.workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Seul le responsable peut supprimer une archive.');
    }
    return this.prisma.workshopArchive.delete({ where: { id: archiveId } });
  }

  // ---------- LISTER LES MEMBRES ----------
  async getMembers(workshopId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');

    return this.prisma.workshopMember.findMany({
      where: { workshopId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  // ---------- LISTER LES DEMANDES EN ATTENTE ----------
  async getPendingRequests(workshopId: string, leaderId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Atelier introuvable.');
    if (workshop.leaderId !== leaderId) {
      throw new ForbiddenException('Accès réservé au responsable.');
    }

    return this.prisma.workshopMember.findMany({
      where: { workshopId, status: 'pending' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }
}