import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UNE RESSOURCE ----------
  async create(userId: string, data: any) {
    const { title, description, type, fileUrl, thumbnail, author, category, duration, isPublished } = data;
    if (!title || !type || !fileUrl) {
      throw new BadRequestException('Titre, type et fichier requis.');
    }

    return this.prisma.libraryItem.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        thumbnail,
        author,
        category,
        duration,
        isPublished: isPublished !== undefined ? isPublished : true,
        userId,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ---------- LISTER TOUTES LES RESSOURCES ----------
  async findAll(filters?: { type?: string; category?: string }) {
    const where: any = { isPublished: true };
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;

    return this.prisma.libraryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ---------- LISTER TOUTES LES RESSOURCES (admin) ----------
  async findAllAdmin() {
    return this.prisma.libraryItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ---------- DÉTAIL D'UNE RESSOURCE ----------
  async findOne(id: string) {
    const item = await this.prisma.libraryItem.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!item) throw new NotFoundException('Ressource introuvable.');
    return item;
  }

  // ---------- MODIFIER UNE RESSOURCE ----------
  async update(id: string, userId: string, data: any) {
    const item = await this.prisma.libraryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Ressource introuvable.');
    if (item.userId !== userId) {
      throw new ForbiddenException('Seul le créateur peut modifier cette ressource.');
    }

    return this.prisma.libraryItem.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        fileUrl: data.fileUrl,
        thumbnail: data.thumbnail,
        author: data.author,
        category: data.category,
        duration: data.duration,
        isPublished: data.isPublished,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ---------- SUPPRIMER UNE RESSOURCE ----------
  async remove(id: string, userId: string) {
    const item = await this.prisma.libraryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Ressource introuvable.');
    if (item.userId !== userId) {
      throw new ForbiddenException('Seul le créateur peut supprimer cette ressource.');
    }

    return this.prisma.libraryItem.delete({ where: { id } });
  }

  // ---------- RÉCUPÉRER LES TYPES ET CATÉGORIES ----------
  async getTypes() {
    const types = await this.prisma.libraryItem.findMany({
      select: { type: true },
      distinct: ['type'],
    });
    return types.map(t => t.type);
  }

  async getCategories() {
    const categories = await this.prisma.libraryItem.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } },
    });
    return categories.map(c => c.category);
  }
}