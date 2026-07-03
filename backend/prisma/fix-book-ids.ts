import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixBookIds() {
  console.log('🔧 Correction des bookId dans les versets...');

  // Récupérer tous les livres avec leur nom
  const books = await prisma.bibleBook.findMany();
  const bookNameToId: Record<string, string> = {};
  for (const book of books) {
    bookNameToId[book.name] = book.id;
  }

  // Récupérer les versets
  const verses = await prisma.bibleVerse.findMany();
  let fixed = 0;

  for (const verse of verses) {
    // Vérifier si le bookId actuel est valide
    const bookExists = books.some(b => b.id === verse.bookId);
    if (!bookExists) {
      // On ne peut pas deviner le nom du livre automatiquement, donc on ignore ce verset.
      console.warn(`⚠️ Verset ${verse.id} bookId invalide : ${verse.bookId}`);
      // On pourrait le supprimer ou le relier à un livre par défaut, mais ce n'est pas idéal.
    }
  }

  console.log(`✅ ${fixed} versets corrigés.`);
  await prisma.$disconnect();
}

fixBookIds().catch(console.error);