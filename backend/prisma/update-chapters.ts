import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateChapters() {
  console.log('📚 Mise à jour du nombre de chapitres par livre...');

  // Récupérer tous les livres
  const books = await prisma.bibleBook.findMany();
  let count = 0;

  for (const book of books) {
    // Compter le nombre de chapitres maximum pour ce livre
    const maxChapter = await prisma.bibleVerse.aggregate({
      where: { bookId: book.id },
      _max: { chapter: true },
    });

    const chapters = maxChapter._max.chapter || 0;

    if (chapters > 0) {
      // Mettre à jour le livre
      await prisma.bibleBook.update({
        where: { id: book.id },
        data: { chapters },
      });
      console.log(`✅ ${book.nameFr} : ${chapters} chapitres`);
      count++;
    }
  }

  console.log(`✅ ${count} livres mis à jour.`);
  await prisma.$disconnect();
}

updateChapters().catch((error) => {
  console.error('❌ Erreur :', error);
  process.exit(1);
});