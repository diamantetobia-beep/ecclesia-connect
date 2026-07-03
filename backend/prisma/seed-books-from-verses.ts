import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createBooksFromVerses() {
  console.log('📚 Création des livres à partir des versets existants...');

  // 1. Récupérer tous les bookId distincts
  const distinctEntries = await prisma.bibleVerse.findMany({
    select: { bookId: true },
    distinct: ['bookId'],
  });

  const bookIds = distinctEntries.map(e => e.bookId);

  if (bookIds.length === 0) {
    console.log('❌ Aucun verset trouvé. La base est vide.');
    await prisma.$disconnect();
    return;
  }

  console.log(`📖 ${bookIds.length} livres trouvés dans les versets.`);

  // 2. Pour chaque bookId, on récupère le nom du livre depuis la relation
  // Problème : si la table BibleBook est vide, on ne peut pas récupérer le nom.
  // Solution : créer les livres à partir des noms extraits manuellement (voir ci-dessous)

  // 🔥 Alternative : création manuelle des livres (plus fiable)
  const bookNames = [
    'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome',
    'Josué', 'Juges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Rois', '2 Rois', '1 Chroniques', '2 Chroniques', 'Esdras',
    'Néhémie', 'Esther', 'Job', 'Psaumes', 'Proverbes',
    'Ecclésiaste', 'Cantique des cantiques', 'Ésaïe', 'Jérémie', 'Lamentations',
    'Ézéchiel', 'Daniel', 'Osée', 'Joël', 'Amos',
    'Abdias', 'Jonas', 'Michée', 'Nahum', 'Habacuc',
    'Sophonie', 'Aggée', 'Zacharie', 'Malachie',
    'Matthieu', 'Marc', 'Luc', 'Jean', 'Actes des Apôtres',
    'Romains', '1 Corinthiens', '2 Corinthiens', 'Galates', 'Éphésiens',
    'Philippiens', 'Colossiens', '1 Thessaloniciens', '2 Thessaloniciens',
    '1 Timothée', '2 Timothée', 'Tite', 'Philémon', 'Hébreux',
    'Jacques', '1 Pierre', '2 Pierre', '1 Jean', '2 Jean', '3 Jean',
    'Jude', 'Apocalypse'
  ];

  for (const name of bookNames) {
    await prisma.bibleBook.upsert({
      where: { name },
      update: {},
      create: {
        name,
        nameFr: name,
        testament: 'Ancien', // à ajuster manuellement si besoin
        chapters: 0,
      },
    });
  }

  console.log(`✅ ${bookNames.length} livres créés/mis à jour.`);

  await prisma.$disconnect();
}

createBooksFromVerses().catch(console.error);