import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const bookNamesMap: Record<string, string> = {
  // ---- ANCIEN TESTAMENT (Abréviations) ----
  'Gen': 'Genèse',
  'Exod': 'Exode',
  'Lev': 'Lévitique',
  'Num': 'Nombres',
  'Deut': 'Deutéronome',
  'Josh': 'Josué',
  'Jos': 'Josué',
  'Judg': 'Juges',
  'Jdg': 'Juges',
  'Rut': 'Ruth',
  '1Sam': '1 Samuel',
  '2Sam': '2 Samuel',
  '1Sa': '1 Samuel',
  '2Sa': '2 Samuel',
  '1Kgs': '1 Rois',
  '2Kgs': '2 Rois',
  '1Ki': '1 Rois',
  '2Ki': '2 Rois',
  '1Chr': '1 Chroniques',
  '2Chr': '2 Chroniques',
  '1Ch': '1 Chroniques',
  '2Ch': '2 Chroniques',
  'Ezra': 'Esdras',
  'Ezr': 'Esdras',
  'Neh': 'Néhémie',
  'Esth': 'Esther',
  'Est': 'Esther',
  'Job': 'Job',
  'Ps': 'Psaumes',
  'Psa': 'Psaumes',
  'Prov': 'Proverbes',
  'Pro': 'Proverbes',
  'Ecc': 'Ecclésiaste',
  'Ecc1': 'Ecclésiaste',
  'Eccl': 'Ecclésiaste',
  'Son': 'Cantique des cantiques',
  'Isa': 'Ésaïe',
  'Jer': 'Jérémie',
  'Lam': 'Lamentations',
  'Ezek': 'Ézéchiel',
  'Eze': 'Ézéchiel',
  'Dan': 'Daniel',
  'Hos': 'Osée',
  'Joel': 'Joël',
  'Song': 'cantiques des cantiques',
  'Joe': 'Joël',
  'Amo': 'Amos',
  'Obad': 'Abdias',
  'Oba': 'Abdias',
  'Jonah': 'Jonas',
  'Jon': 'Jonas',
  'Mic': 'Michée',
  'Nah': 'Nahum',
  'Hab': 'Habacuc',
  'Zeph': 'Sophonie',
  'Zep': 'Sophonie',
  'Hag': 'Aggée',
  'Zech': 'Zacharie',
  'Zec': 'Zacharie',
  'Mal': 'Malachie',

  // ---- NOUVEAU TESTAMENT (Abréviations) ----
  'Matt': 'Matthieu',
  'Mat': 'Matthieu',
  'Mark': 'Marc',
  'Mar': 'Marc',
  'Luke': 'Luc',
  'Luk': 'Luc',
  'John': 'Jean',
  'Joh': 'Jean',
  'Acts': 'Actes des Apôtres',
  'Act': 'Actes des Apôtres',
  'Rom': 'Romains',
  '1Cor': '1 Corinthiens',
  '2Cor': '2 Corinthiens',
  '1Co': '1 Corinthiens',
  '2Co': '2 Corinthiens',
  'Gal': 'Galates',
  'Eph': 'Éphésiens',
  'Phil': 'Philippiens',
  'Phi': 'Philippiens',
  'Col': 'Colossiens',
  '1Thess': '1 Thessaloniciens',
  '2Thess': '2 Thessaloniciens',
  '1Th': '1 Thessaloniciens',
  '2Th': '2 Thessaloniciens',
  '1Tim': '1 Timothée',
  '2Tim': '2 Timothée',
  '1Ti': '1 Timothée',
  '2Ti': '2 Timothée',
  'Tit': 'Tite',
  'Titus': 'Tite',
  'Phlm': 'Philémon',
  'Phm': 'Philémon',
  'Heb': 'Hébreux',
  'Jam': 'Jacques',
  'Jas': 'Jacques',
  '1Pet': '1 Pierre',
  '2Pet': '2 Pierre',
  '1Pe': '1 Pierre',
  '2Pe': '2 Pierre',
  '1John': '1 Jean',
  '2John': '2 Jean',
  '3John': '3 Jean',
  '1Jo': '1 Jean',
  '2Jo': '2 Jean',
  '3Jo': '3 Jean',
  'Jude': 'Jude',
  'Jde': 'Jude',
  'Rev': 'Apocalypse',

  // ---- NOMS COMPLETS (EN ANGLAIS) ----
  'Genesis': 'Genèse',
  'Exodus': 'Exode',
  'Leviticus': 'Lévitique',
  'Numbers': 'Nombres',
  'Deuteronomy': 'Deutéronome',
  'Joshua': 'Josué',
  'Judges': 'Juges',
  'Ruth': 'Ruth',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Rois',
  '2 Kings': '2 Rois',
  '1 Chronicles': '1 Chroniques',
  '2 Chronicles': '2 Chroniques',
  
  'Nehemiah': 'Néhémie',
  'Esther': 'Esther',
  
  'Psalms': 'Psaumes',
  'Proverbs': 'Proverbes',
  'Ecclesiastes': 'Ecclésiaste',
  'Song of Solomon': 'Cantique des cantiques',
  'Isaiah': 'Ésaïe',
  'Jeremiah': 'Jérémie',
  'Lamentations': 'Lamentations',
  'Ezekiel': 'Ézéchiel',
  'Daniel': 'Daniel',
  'Hosea': 'Osée',
  
  'Amos': 'Amos',
  'Obadiah': 'Abdias',
  
  'Micah': 'Michée',
  'Nahum': 'Nahum',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sophonie',
  'Haggai': 'Aggée',
  'Zechariah': 'Zacharie',
  'Malachi': 'Malachie',
  'Matthew': 'Matthieu',
  
  
  
  
  'Romans': 'Romains',
  '1 Corinthians': '1 Corinthiens',
  '2 Corinthians': '2 Corinthiens',
  'Galatians': 'Galates',
  'Ephesians': 'Éphésiens',
  'Philippians': 'Philippiens',
  'Colossians': 'Colossiens',
  '1 Thessalonians': '1 Thessaloniciens',
  '2 Thessalonians': '2 Thessaloniciens',
  '1 Timothy': '1 Timothée',
  '2 Timothy': '2 Timothée',
  
  'Philemon': 'Philémon',
  'Hebrews': 'Hébreux',
  'James': 'Jacques',
  '1 Peter': '1 Pierre',
  '2 Peter': '2 Pierre',
  '1 John': '1 Jean',
  '2 John': '2 Jean',
  '3 John': '3 Jean',
  
  'Revelation': 'Apocalypse',
};

async function updateBookNames() {
  console.log('📚 Mise à jour des noms des livres...');

  // Récupérer tous les livres
  const books = await prisma.bibleBook.findMany();
  console.log(`📖 ${books.length} livres trouvés dans la base.`);

  if (books.length === 0) {
    console.log('⚠️ Aucun livre trouvé. La table BibleBook est vide.');
    await prisma.$disconnect();
    return;
  }

  let updated = 0;

  for (const book of books) {
    // Chercher le nom français
    let frenchName = bookNamesMap[book.name] || bookNamesMap[book.nameFr || ''] || null;

    if (!frenchName) {
      console.warn(`⚠️ Nom non trouvé pour : ${book.name}`);
      continue;
    }

    // Si le nom français est différent de l'actuel, on met à jour
    if (book.nameFr !== frenchName) {
      await prisma.bibleBook.update({
        where: { id: book.id },
        data: { nameFr: frenchName },
      });
      console.log(`✅ ${book.name} → ${frenchName}`);
      updated++;
    }
  }

  console.log(`✅ ${updated} livres mis à jour sur ${books.length}.`);
  await prisma.$disconnect();
}

updateBookNames()
  .then(() => console.log('🎉 Script terminé avec succès.'))
  .catch((error) => {
    console.error('❌ Erreur :', error);
    process.exit(1);
  });