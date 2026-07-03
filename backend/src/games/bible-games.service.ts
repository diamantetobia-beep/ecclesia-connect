import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BibleGamesService {
  constructor(private prisma: PrismaService) {}

  // ---------- COMPLÈTE LA PHRASE ----------
  async getCompletionGame(): Promise<any> {
    // Sélectionne un verset aléatoire, masque un mot
    const count = await this.prisma.bibleVerse.count();
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const words = verse.text.split(' ');
    const wordIndex = Math.floor(Math.random() * words.length);
    const maskedWord = words[wordIndex];
    words[wordIndex] = '_____';
    const maskedText = words.join(' ');

    return {
      type: 'completion',
      reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
      maskedText,
      answer: maskedWord,
    };
  }

  // ---------- QUI A DIT ? ----------
  async getWhoSaidGame(): Promise<any> {
    // Sélectionne un verset contenant une citation (ex: "Jésus dit")
    const quotes = await this.prisma.bibleVerse.findMany({
      where: {
        text: { contains: 'dit' },
      },
      take: 50,
      include: { book: true },
    });

    if (quotes.length === 0) return null;
    const random = quotes[Math.floor(Math.random() * quotes.length)];

    // Extraire le personnage (simplifié)
    let speaker = 'Jésus';
    if (random.text.includes('Moïse')) speaker = 'Moïse';
    else if (random.text.includes('David')) speaker = 'David';
    else if (random.text.includes('Paul')) speaker = 'Paul';
    else if (random.text.includes('Pierre')) speaker = 'Pierre';
    else if (random.text.includes('Jean')) speaker = 'Jean';

    return {
      type: 'who_said',
      text: random.text,
      reference: `${random.book.nameFr} ${random.chapter}:${random.verse}`,
      answer: speaker,
      options: ['Jésus', 'Moïse', 'David', 'Paul', 'Pierre', 'Jean'],
    };
  }

  // ---------- DANS QUEL LIVRE ? ----------
  async getBookGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    // 3 faux livres
    const allBooks = await this.prisma.bibleBook.findMany({
      select: { nameFr: true },
    });
    const options = [verse.book.nameFr];
    const shuffled = allBooks.sort(() => Math.random() - 0.5);
    for (const b of shuffled) {
      if (b.nameFr !== verse.book.nameFr && !options.includes(b.nameFr)) {
        options.push(b.nameFr);
        if (options.length === 4) break;
      }
    }

    return {
      type: 'book_quiz',
      text: verse.text,
      options: options.sort(() => Math.random() - 0.5),
      answer: verse.book.nameFr,
    };
  }

  // ---------- DANS QUEL CHAPITRE ? ----------
  async getChapterGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    // 3 faux chapitres
    const options = [verse.chapter];
    const book = await this.prisma.bibleBook.findUnique({
      where: { id: verse.bookId },
    });
    for (let i = 0; i < 3; i++) {
      const fake = Math.floor(Math.random() * (book?.chapters || 50)) + 1;
      if (!options.includes(fake)) options.push(fake);
    }

    return {
      type: 'chapter_quiz',
      text: verse.text,
      book: verse.book.nameFr,
      options: options.sort(() => Math.random() - 0.5),
      answer: verse.chapter,
    };
  }
}