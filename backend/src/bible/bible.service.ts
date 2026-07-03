import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BibleService {
  constructor(private prisma: PrismaService) {}

  // Recherche améliorée : insensible à la casse et aux accents (via normalisation)
  async searchVerses(query: string, limit: number = 20) {
    const lower = query.toLowerCase();
    // Supprimer les accents pour une recherche plus large
    const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Recherche avec contains (insensible à la casse en SQLite)
    const results = await this.prisma.bibleVerse.findMany({
      where: {
        OR: [
          { text: { contains: lower } },
          { text: { contains: query } },
          { book: { nameFr: { contains: lower } } },
          { book: { name: { contains: lower } } },
        ],
      },
      include: { book: true },
      take: limit,
    });

    // Si aucun résultat, on tente une recherche sur le nom du livre uniquement
    if (results.length === 0) {
      const bookResults = await this.prisma.bibleVerse.findMany({
        where: {
          book: {
            OR: [
              { nameFr: { contains: lower } },
              { name: { contains: lower } },
            ],
          },
        },
        include: { book: true },
        take: limit,
      });
      return bookResults;
    }

    return results;
  }

  // ... (autres méthodes)
}