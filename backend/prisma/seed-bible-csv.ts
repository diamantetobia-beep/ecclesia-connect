import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function seedBibleManual() {
  console.log('🧹 Nettoyage des anciens versets...');
  await prisma.bibleVerse.deleteMany({});
  console.log('✅ Anciens versets supprimés.');

  const filePath = 'prisma/bible_brut.csv';
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier ${filePath} introuvable.`);
    await prisma.$disconnect();
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log('📖 Lecture et import du fichier CSV...');

  let count = 0;
  const bookCache = new Map<string, any>();

  for await (const line of rl) {
    // Découpage par tabulation
    let parts = line.split('\t');
    if (parts.length < 4) {
      // Fallback : espaces multiples
      parts = line.trim().split(/\s{2,}/);
    }
    if (parts.length < 4) continue;

    const bookName = parts[0].trim();
    const chapter = parseInt(parts[1].trim(), 10);
    const verse = parseInt(parts[2].trim(), 10);
    let text = parts.slice(3).join(' ').trim();
    text = text.replace(/<[^>]*>/g, '').trim();

    if (isNaN(chapter) || isNaN(verse) || !text) continue;

    // Récupérer ou créer le livre
    let book = bookCache.get(bookName);
    if (!book) {
      const existingBook = await prisma.bibleBook.findUnique({
        where: { name: bookName },
      });
      if (existingBook) {
        book = existingBook;
      } else {
        book = await prisma.bibleBook.create({
          data: {
            name: bookName,
            nameFr: bookName,
            testament: 'Ancien',
            chapters: 0,
          },
        });
        console.log(`📚 Livre créé : ${bookName}`);
      }
      bookCache.set(bookName, book);
    }

    const verseId = `${book.id}-${chapter}-${verse}`;
    try {
      await prisma.bibleVerse.create({
        data: {
          id: verseId,
          bookId: book.id,
          chapter,
          verse,
          text,
        },
      });
      count++;
      if (count % 1000 === 0) console.log(`📖 ${count} versets importés...`);
    } catch (e) {
      // Ignorer les doublons
    }
  }

  console.log(`✅ ${count} versets importés !`);

  // Mise à jour des chapitres
  console.log('📚 Mise à jour du nombre de chapitres...');
  for (const [bookName, book] of bookCache) {
    const maxChapter = await prisma.bibleVerse.aggregate({
      where: { bookId: book.id },
      _max: { chapter: true },
    });
    await prisma.bibleBook.update({
      where: { id: book.id },
      data: { chapters: maxChapter._max.chapter || 0 },
    });
    console.log(`✅ ${bookName} : ${maxChapter._max.chapter || 0} chapitres`);
  }

  console.log(`📊 ${await prisma.bibleVerse.count()} versets au total.`);
  await prisma.$disconnect();
}

seedBibleManual().catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});