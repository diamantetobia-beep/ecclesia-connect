import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildBibleResponse } from './models';

@Injectable()
export class ResponseBuilderService {
  constructor(private prisma: PrismaService) {}

  // ---------- CONSTRUCTION RÉPONSE BIBLIQUE ----------
  async buildBibleResponse(theme: string, verses: any[]): Promise<string> {
    if (verses.length === 0) {
      // 1. Chercher dans les noms de livres
      const books = await this.prisma.bibleBook.findMany({
        where: {
          OR: [
            { name: { contains: theme } },
            { nameFr: { contains: theme } },
          ],
        },
      });
      if (books.length > 0) {
        return `📖 Le thème "${theme}" apparaît dans les livres suivants : ${books.map(b => b.nameFr).join(', ')}.\n\n💡 Utilise l'Assistant IA pour explorer ces livres.`;
      }

      // 2. Chercher des informations avec des synonymes
      const synonyms = this.getSynonyms(theme);
      for (const syn of synonyms) {
        const altVerses = await this.prisma.bibleVerse.findMany({
          where: { text: { contains: syn } },
          take: 3,
          include: { book: true },
        });
        if (altVerses.length > 0) {
          const refs = altVerses.map(v => `${v.book.nameFr} ${v.chapter}:${v.verse}`).join(', ');
          return `🔍 Je n'ai pas trouvé exactement "${theme}", mais voici des versets sur "${syn}" :\n${altVerses.map(v => `- ${v.book.nameFr} ${v.chapter}:${v.verse} – ${v.text.substring(0, 80)}...`).join('\n')}\n\n📖 Références : ${refs}`;
        }
      }

      return `📖 Je n'ai pas trouvé de versets sur le thème "${theme}". Essaie avec d'autres mots-clés (ex: pardon, foi, amour, paix).`;
    }

    const structured = buildBibleResponse(theme, verses);
    let response = structured.introduction + '\n\n';
    response += '**Versets clés :**\n';
    for (const v of structured.verses) {
      response += `- ${v}\n`;
    }
    response += '\n' + structured.explanation + '\n';
    response += '\n' + structured.conclusion;
    return response;
  }

  // ---------- RECHERCHE PLATEFORME ----------
  async searchPlatform(query: string): Promise<string> {
    const lower = query.toLowerCase();
    const results: string[] = [];

    // 1. Publications
    const posts = await this.prisma.post.findMany({
      where: { content: { contains: lower } },
      take: 3,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
    for (const p of posts) {
      results.push(`📝 ${p.author.firstName} ${p.author.lastName} : "${p.content}"`);
    }

    // 2. Événements
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: lower } },
          { description: { contains: lower } },
        ],
      },
      take: 3,
      orderBy: { startDate: 'asc' },
    });
    for (const e of events) {
      results.push(`📅 ${e.title} : ${e.description || ''} (${new Date(e.startDate).toLocaleDateString()})`);
    }

    // 3. Ateliers
    const workshops = await this.prisma.workshop.findMany({
      where: {
        OR: [
          { name: { contains: lower } },
          { description: { contains: lower } },
        ],
      },
      take: 3,
      include: { leader: true },
    });
    for (const w of workshops) {
      results.push(`🎵 ${w.name} (${w.leader.firstName} ${w.leader.lastName}) : ${w.description || ''}`);
    }

    // 4. Demandes de prière
    const prayers = await this.prisma.prayerRequest.findMany({
      where: {
        OR: [
          { title: { contains: lower } },
          { content: { contains: lower } },
        ],
      },
      take: 3,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    for (const p of prayers) {
      results.push(`🙏 ${p.user.firstName} ${p.user.lastName} : "${p.content}"`);
    }

    if (results.length === 0) {
      return 'ℹ️ Je n\'ai pas trouvé d\'information dans l\'application sur ce sujet. Essaie avec d\'autres mots-clés.';
    }

    return `✅ **Voici ce que j'ai trouvé dans Ecclesia Connect :**\n\n${results.join('\n\n')}`;
  }

  // ---------- RÉPONSE GENERIQUE (fallback) ----------
  async getFallbackResponse(query: string): Promise<string> {
    return `🤔 Je n'ai pas bien compris ta question. Essaie de la reformuler ou de poser une question sur la Bible, l'application, ou un sujet spirituel.`;
  }

  // ---------- SYNONYMES (pour la recherche biblique) ----------
  private getSynonyms(theme: string): string[] {
    const map: Record<string, string[]> = {
      'moïse': ['Moise', 'Moyse', 'Moïse'],
      'jésus': ['Jésus', 'Jesus', 'Christ'],
      'dieu': ['Dieu', 'Éternel', 'Seigneur'],
      'paul': ['Paul', 'Saul'],
      'pierre': ['Pierre', 'Simon'],
      'jean': ['Jean', 'Johann'],
      'david': ['David', 'Roi'],
    };
    const lower = theme.toLowerCase();
    for (const [key, synonyms] of Object.entries(map)) {
      if (lower.includes(key) || synonyms.some(s => lower.includes(s.toLowerCase()))) {
        return synonyms;
      }
    }
    return [theme];
  }
}