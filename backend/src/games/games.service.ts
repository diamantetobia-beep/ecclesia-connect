import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ---------- CONSTANTES ----------
const speakerKeywords: Record<string, string[]> = {
  'Dieu': ['Dieu', 'Éternel', 'Seigneur'],
  'Jésus': ['Jésus', 'Christ', 'Fils'],
  'Moïse': ['Moïse'],
  'David': ['David'],
  'Paul': ['Paul', 'apôtre'],
  'Pierre': ['Pierre'],
  'Jean': ['Jean'],
  'Ésaïe': ['Ésaïe'],
  'Jérémie': ['Jérémie'],
  'Abraham': ['Abraham'],
  'Noé': ['Noé'],
  'Salomon': ['Salomon'],
  'Marie': ['Marie'],
  'Ange': ['ange', 'Gabriel'],
};

const allCharacters = Object.keys(speakerKeywords);

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  // ---------- UTILITAIRE : Générer des faux choix ----------
  private async generateFakeChoices(correct: string, pool: string[], count: number = 3): Promise<string[]> {
    const fakes: string[] = [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const item of shuffled) {
      if (item !== correct && !fakes.includes(item)) {
        fakes.push(item);
        if (fakes.length === count) break;
      }
    }
    while (fakes.length < count) {
      const fallback = ['amour', 'foi', 'paix', 'grâce', 'pardon', 'espérance', 'joie'];
      const candidate = fallback[Math.floor(Math.random() * fallback.length)];
      if (candidate !== correct && !fakes.includes(candidate)) {
        fakes.push(candidate);
      }
    }
    return fakes;
  }

  // ---------- 1. QUI A DIT ? ----------
 async getWhoSaidGame(): Promise<any> {
  // ✅ Récupérer une large sélection de versets
  const quotes = await this.prisma.bibleVerse.findMany({
    where: {
      OR: [
        { text: { contains: 'dit' } },
        { text: { contains: 'déclara' } },
        { text: { contains: 'répondit' } },
        { text: { contains: 's\'écria' } },
        { text: { contains: 'parla' } },
        { text: { contains: 's\'adressa' } },
        { text: { contains: 'reprit' } },
        { text: { contains: 'continua' } },
      ],
    },
    take: 500,
    include: { book: true },
  });

  if (quotes.length === 0) {
    return this.getWhoSaidFallback();
  }

  // ✅ Liste des verbes de parole à supprimer (avec leurs variantes)
  const speechVerbs = [
    'dit', 'déclara', 'répondit', 's\'écria', 'parla', 
    's\'adressa', 'reprit', 'continua', 'ajouta', 'proclama',
    'annonça', 'enseigna', 'prêcha', 'cria', 'demanda',
    'ordonna', 'commanda', 'bénit', 'maudit', 'jura',
    'affirma', 'déclare', 'répond', 'parle', 'dit-il',
    'dirent', 'parlèrent', 'répondirent', 's\'écrièrent'
  ];

  // ✅ Construire les patterns pour détecter les verbes de parole
  const verbPatterns = speechVerbs.map(v => new RegExp(`(?:^|\\s)(${v})(?:\\s|[:;,.]|$)`));

  // ✅ Extraire le locuteur et le discours
  const validVerses = quotes.filter(v => {
    const text = v.text;
    for (const pattern of verbPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  });

  if (validVerses.length === 0) {
    return this.getWhoSaidFallback();
  }

  // Mélanger et prendre un verset
  const shuffled = validVerses.sort(() => Math.random() - 0.5);
  let random = shuffled[0];
  let speech = '';
  let detectedSpeaker = 'Jésus';

  for (const verse of shuffled) {
    const text = verse.text;
    let found = false;

    // ✅ 1. Identifier le locuteur (nom avant le verbe)
    const speakerMatch = text.match(/^([A-ZÀ-ÿ][a-zÀ-ÿéèêëïîôöûüç\s]+?)\s+(?:dit|déclara|répondit|s'écria|parla|s'adressa|reprit|continua|ajouta|proclama|annonça|enseigna|prêcha|cria|demanda|ordonna|commanda|bénit|maudit|jura|affirma|déclare|répond|parle|dit-il|dirent|parlèrent|répondirent|s'écrièrent)/i);

    if (speakerMatch) {
      let speaker = speakerMatch[1].trim();
      // Nettoyer le nom du locuteur (enlever les éventuels "et" ou "mais" en début)
      speaker = speaker.replace(/^et\s+/i, '').replace(/^mais\s+/i, '').trim();
      
      // Vérifier si c'est un personnage connu
      const knownSpeakers = ['Dieu', 'Jésus', 'Moïse', 'David', 'Paul', 'Pierre', 'Jean', 'Abraham', 'Noé', 'Salomon', 'Ésaïe', 'Jérémie', 'Éternel', 'Seigneur'];
      
      let matchedSpeaker = knownSpeakers.find(s => speaker.includes(s) || s.includes(speaker));
      
      if (matchedSpeaker) {
        detectedSpeaker = matchedSpeaker;
        // ✅ 2. Extraire le discours (tout ce qui suit le verbe)
        const afterVerb = text.replace(speakerMatch[0], '').trim();
        // Nettoyer les guillemets, virgules, etc.
        speech = afterVerb.replace(/^[\s,;:""''']+/, '').replace(/[\s,;:""''']+$/, '');
        
        // Si le discours contient encore le nom du locuteur (cas "Dieu dit :"), on le supprime
        for (const s of knownSpeakers) {
          const regex = new RegExp(`^${s}\\s*[:;,]?\\s*`, 'i');
          speech = speech.replace(regex, '');
        }
        
        if (speech.length > 10) {
          found = true;
          random = verse;
          break;
        }
      }
    }

    if (found && speech.length > 10) break;
  }

  // Si aucun discours valide n'a été trouvé, fallback
  if (!speech || speech.length < 10) {
    return this.getWhoSaidFallback();
  }

  // ✅ Générer les choix
  const allSpeakers = ['Dieu', 'Jésus', 'Moïse', 'David', 'Paul', 'Pierre', 'Jean', 'Abraham', 'Noé', 'Salomon', 'Ésaïe', 'Jérémie'];
  const fakeChoices = allSpeakers
    .filter(s => s !== detectedSpeaker)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const choices = [detectedSpeaker, ...fakeChoices].sort(() => Math.random() - 0.5);

  return {
    type: 'who_said',
    question: '🗣️ Qui a dit cette parole ?',
    text: speech,
    reference: `${random.book.nameFr} ${random.chapter}:${random.verse}`,
    choices: choices,
    answer: detectedSpeaker,
    xp: 100,
    difficulty: 2,
  };
}

// ---------- FALLBACK UNIQUEMENT EN DERNIER RECOURS ----------
private getWhoSaidFallback(): any {
  const fallbacks = [
    { text: 'Je suis le chemin, la vérité et la vie.', speaker: 'Jésus', reference: 'Jean 14:6' },
    { text: 'Aimez-vous les uns les autres comme je vous ai aimés.', speaker: 'Jésus', reference: 'Jean 15:12' },
    { text: 'Ne vous inquiétez pas pour le lendemain.', speaker: 'Jésus', reference: 'Matthieu 6:34' },
    { text: 'La foi est une ferme assurance des choses qu\'on espère.', speaker: 'Paul', reference: 'Hébreux 11:1' },
    { text: 'Confie-toi en l\'Éternel de tout ton cœur.', speaker: 'David', reference: 'Proverbes 3:5' },
    { text: 'Ne jugez pas, et vous ne serez pas jugés.', speaker: 'Jésus', reference: 'Luc 6:37' },
    { text: 'Je suis le bon berger.', speaker: 'Jésus', reference: 'Jean 10:11' },
    { text: 'Dieu est amour.', speaker: 'Jean', reference: '1 Jean 4:16' },
  ];
  
  const random = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  const allSpeakers = ['Dieu', 'Jésus', 'Moïse', 'David', 'Paul', 'Pierre', 'Jean', 'Abraham', 'Noé', 'Salomon'];
  const fakeChoices = allSpeakers
    .filter(s => s !== random.speaker)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const choices = [random.speaker, ...fakeChoices].sort(() => Math.random() - 0.5);

  return {
    type: 'who_said',
    question: '🗣️ Qui a dit cette parole ?',
    text: random.text,
    reference: random.reference,
    choices: choices,
    answer: random.speaker,
    xp: 100,
    difficulty: 2,
  };
}
  // ---------- 2. DANS QUEL LIVRE ? ----------
  async getBookGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const correctBook = verse.book.nameFr;

    const sameTestament = await this.prisma.bibleBook.findMany({
      where: {
        testament: verse.book.testament,
        nameFr: { not: correctBook },
      },
      take: 10,
    });
    const shuffled = sameTestament.sort(() => Math.random() - 0.5);
    const fakeBooks = shuffled.slice(0, 3).map((b) => b.nameFr);

    while (fakeBooks.length < 3) {
      const allBooks = await this.prisma.bibleBook.findMany({
        select: { nameFr: true },
      });
      const available = allBooks
        .map((b) => b.nameFr)
        .filter((name) => name !== correctBook && !fakeBooks.includes(name));
      const shuffledAvailable = available.sort(() => Math.random() - 0.5);
      const needed = 3 - fakeBooks.length;
      for (let i = 0; i < needed && i < shuffledAvailable.length; i++) {
        fakeBooks.push(shuffledAvailable[i]);
      }
    }

    const options = [correctBook, ...fakeBooks].sort(() => Math.random() - 0.5);

    return {
      type: 'book_quiz',
      question: '📚 Dans quel livre se trouve ce verset ?',
      text: verse.text,
      reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
      choices: options,
      answer: correctBook,
      xp: 80,
      difficulty: Math.min(Math.floor(verse.chapter / 10) + 1, 5),
    };
  }

  // ---------- 3. DANS QUEL CHAPITRE ? (CORRIGÉ) ----------
  async getChapterGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const book = await this.prisma.bibleBook.findUnique({
      where: { id: verse.bookId },
    });

    // ✅ Ne PAS afficher la référence complète
    const options = [verse.chapter];
    const maxChapter = book?.chapters || 50;
    for (let i = 0; i < 3; i++) {
      let fake = Math.floor(Math.random() * maxChapter) + 1;
      while (options.includes(fake)) fake = Math.floor(Math.random() * maxChapter) + 1;
      options.push(fake);
    }

    return {
      type: 'chapter_quiz',
      question: `📖 Dans quel chapitre du livre "${verse.book.nameFr}" se trouve ce verset ?`,
      text: verse.text,
      // ✅ On ne donne PAS la référence
      choices: options.sort(() => Math.random() - 0.5),
      answer: verse.chapter,
      bookName: verse.book.nameFr,
      xp: 100,
      difficulty: Math.min(Math.floor(verse.chapter / 10) + 1, 5),
    };
  }

  // ---------- 4. COMPLÈTE LA PHRASE ----------
  async getCompletionGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const words = verse.text.split(' ');
    const validIndexes = words
      .map((w, idx) => ({ word: w, index: idx }))
      .filter((x) => x.word.length > 2 && /^[A-Za-zÀ-ÿ'-]+$/.test(x.word));
    if (validIndexes.length === 0) return null;

    const randomIdx = Math.floor(Math.random() * validIndexes.length);
    const { word: maskedWord, index: wordIndex } = validIndexes[randomIdx];
    const displayWords = [...words];
    displayWords[wordIndex] = '_____';
    const maskedText = displayWords.join(' ');

    const fakeWords = await this.prisma.bibleVerse.findMany({
      select: { text: true },
      take: 100,
    });
    const wordSet = new Set<string>();
    for (const v of fakeWords) {
      const w = v.text.split(' ');
      for (const ww of w) {
        if (ww.length > 2 && /^[A-Za-zÀ-ÿ'-]+$/.test(ww)) {
          wordSet.add(ww);
        }
      }
    }
    const wordList = Array.from(wordSet).sort(() => Math.random() - 0.5);
    const candidates = wordList.filter((w) => w !== maskedWord && w.length > 2);
    const fakeChoices = candidates.slice(0, 3);
    while (fakeChoices.length < 3) {
      const fallback = ['amour', 'foi', 'paix', 'grâce', 'pardon'];
      const f = fallback[Math.floor(Math.random() * fallback.length)];
      if (!fakeChoices.includes(f)) fakeChoices.push(f);
    }
    const choices = [maskedWord, ...fakeChoices].sort(() => Math.random() - 0.5);

    return {
      type: 'completion',
      question: '🧩 Quel est le mot manquant ?',
      text: maskedText,
      choices,
      answer: maskedWord,
      reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
      xp: 60,
      difficulty: Math.min(Math.floor(verse.chapter / 15) + 1, 5),
    };
  }

  // ---------- 5. VERSETS À TROUS ----------
  async getFillGame(difficulty: number = 1): Promise<any> {
    const numHoles = Math.min(difficulty * 2, 5);
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const words = verse.text.split(' ');
    const indices: number[] = [];
    for (let i = 0; i < numHoles && i < words.length; i++) {
      let idx = Math.floor(Math.random() * words.length);
      while (indices.includes(idx)) idx = (idx + 1) % words.length;
      indices.push(idx);
    }
    const holes = indices.map((i) => words[i]);
    indices.forEach((i) => (words[i] = '_____'));
    const maskedText = words.join(' ');

    const firstHole = holes[0];
    const fakeWords = await this.prisma.bibleVerse.findMany({
      select: { text: true },
      take: 100,
    });
    const wordSet = new Set<string>();
    for (const v of fakeWords) {
      const w = v.text.split(' ');
      for (const ww of w) {
        if (ww.length > 2 && /^[A-Za-zÀ-ÿ'-]+$/.test(ww)) {
          wordSet.add(ww);
        }
      }
    }
    const wordList = Array.from(wordSet).sort(() => Math.random() - 0.5);
    const candidates = wordList.filter((w) => w !== firstHole && w.length > 2);
    const fakeChoices = candidates.slice(0, 3);
    while (fakeChoices.length < 3) {
      const fallback = ['amour', 'foi', 'paix', 'grâce', 'pardon'];
      const f = fallback[Math.floor(Math.random() * fallback.length)];
      if (!fakeChoices.includes(f)) fakeChoices.push(f);
    }
    const choices = [firstHole, ...fakeChoices].sort(() => Math.random() - 0.5);

    return {
      type: 'fill',
      question: '🔎 Choisis le mot manquant :',
      text: maskedText,
      choices,
      answer: firstHole,
      reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
      difficulty: Math.min(difficulty, 5),
      xp: 30 * difficulty,
    };
  }

  // ---------- 6. TROUVE LE VERSET ----------
  async getFindGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const description = `🔍 Trouve le verset qui correspond à cette idée : "${this.extractTheme(verse.text)}"`;

    const fakes = await this.prisma.bibleVerse.findMany({
      take: 3,
      skip: (skip + 10) % count,
      include: { book: true },
    });

    const options = [
      { text: verse.text, reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}` },
      ...fakes.map((v: any) => ({
        text: v.text,
        reference: `${v.book.nameFr} ${v.chapter}:${v.verse}`,
      })),
    ].sort(() => Math.random() - 0.5);

    return {
      type: 'find',
      question: description,
      choices: options.map((o) => o.text),
      answer: verse.text,
      references: options.map((o) => o.reference),
      xp: 100,
      difficulty: Math.min(Math.floor(verse.chapter / 15) + 1, 5),
    };
  }

  private extractTheme(text: string): string {
    const themes = ['amour', 'foi', 'paix', 'grâce', 'pardon', 'espérance', 'joie'];
    for (const t of themes) {
      if (text.toLowerCase().includes(t)) return t;
    }
    return 'Dieu';
  }

  // ---------- 7. VRAI OU FAUX ----------
  async getTrueFalseGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verse = await this.prisma.bibleVerse.findFirst({
      skip,
      take: 1,
      include: { book: true },
    });
    if (!verse) return null;

    const isTrue = Math.random() > 0.5;
    const statement = isTrue
      ? `"${verse.text}" (${verse.book.nameFr} ${verse.chapter}:${verse.verse})`
      : `"${this.modifyVerse(verse.text)}" (${verse.book.nameFr} ${verse.chapter}:${verse.verse})`;

    return {
      type: 'truefalse',
      question: '✅ Vrai ou Faux ?',
      statement,
      answer: isTrue,
      reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
      xp: 40,
      difficulty: Math.min(Math.floor(verse.chapter / 20) + 1, 5),
    };
  }

  private modifyVerse(text: string): string {
    const words = text.split(' ');
    if (words.length < 3) return text + ' (modifié)';
    const idx = Math.floor(Math.random() * (words.length - 2)) + 1;
    const replacements = ['amour', 'foi', 'paix', 'grâce', 'pardon'];
    words[idx] = replacements[Math.floor(Math.random() * replacements.length)];
    return words.join(' ');
  }

  // ---------- 8. QUI SUIS-JE ? ----------
  async getWhoAmIGame(): Promise<any> {
    const characters = ['Moïse', 'David', 'Jésus', 'Paul', 'Pierre', 'Jean', 'Abraham', 'Noé'];
    const character = characters[Math.floor(Math.random() * characters.length)];

    const verses = await this.prisma.bibleVerse.findMany({
      where: { text: { contains: character } },
      take: 10,
      include: { book: true },
    });

    const clues = verses.slice(0, 3).map((v: any) => v.text);
    const fakeChoices = await this.generateFakeChoices(character, characters, 3);
    const options = [character, ...fakeChoices].sort(() => Math.random() - 0.5);

    return {
      type: 'whoami',
      question: '🔍 Qui est ce personnage biblique ?',
      clues,
      choices: options,
      answer: character,
      xp: 150,
      difficulty: 3,
    };
  }

  // ---------- 9. JEU ALÉATOIRE ----------
  async getRandomGame(): Promise<any> {
    const games = [
      this.getWhoSaidGame.bind(this),
      this.getBookGame.bind(this),
      this.getChapterGame.bind(this),
      this.getCompletionGame.bind(this),
      this.getFillGame.bind(this),
      this.getFindGame.bind(this),
      this.getTrueFalseGame.bind(this),
      this.getWhoAmIGame.bind(this),
    ];
    const shuffled = games.sort(() => Math.random() - 0.5);
    for (const fn of shuffled) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (e: any) {
        console.warn('Jeu ignoré:', e.message || e);
      }
    }
    return {
      type: 'random',
      question: '📖 Devine le mot manquant :',
      text: 'Au commencement, Dieu créa les _____ et la terre.',
      choices: ['cieux', 'terres', 'eaux', 'lumières'],
      answer: 'cieux',
      reference: 'Genèse 1:1',
      xp: 100,
      difficulty: 1,
    };
  }

  // ---------- 10. DEVINE ----------
  async getGuessGame(): Promise<any> {
    const gameFns = [
      this.getCompletionGame.bind(this),
      this.getWhoSaidGame.bind(this),
      this.getBookGame.bind(this),
      this.getChapterGame.bind(this),
      this.getFillGame.bind(this),
      this.getWhoAmIGame.bind(this),
      this.getFindGame.bind(this),
    ];

    const shuffled = gameFns.sort(() => Math.random() - 0.5);

    for (const fn of shuffled) {
      try {
        const result = await fn();
        if (result) {
          return result;
        }
      } catch (e: any) {
        console.warn('Jeu ignoré:', e.message || e);
      }
    }

    return {
      type: 'guess',
      question: '📖 Quel est le premier livre de la Bible ?',
      choices: ['Genèse', 'Exode', 'Lévitique', 'Nombres'],
      answer: 'Genèse',
      xp: 50,
      difficulty: 1,
    };
  }

  // ---------- 11. COURSE CONTRE LA MONTRE ----------
  async getSpeedGame(difficulty: number = 1): Promise<any> {
    const timeLimits = [15, 30, 60];
    const timeLimit = timeLimits[Math.min(difficulty - 1, 2)];

    const count = await this.prisma.bibleVerse.count();
    if (count === 0) {
      return {
        type: 'speed',
        timeLimit,
        questions: [
          { text: 'Au commencement, Dieu créa les cieux et la terre.', reference: 'Genèse 1:1', answer: 'cieux' },
          { text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique.', reference: 'Jean 3:16', answer: 'monde' },
          { text: 'L\'Éternel est mon berger, je ne manquerai de rien.', reference: 'Psaume 23:1', answer: 'berger' },
          { text: 'Heureux ceux qui ont le cœur pur, car ils verront Dieu.', reference: 'Matthieu 5:8', answer: 'cœur' },
          { text: 'Dieu est Esprit, et ceux qui l\'adorent doivent l\'adorer en esprit et en vérité.', reference: 'Jean 4:24', answer: 'Esprit' },
          { text: 'Aimez-vous les uns les autres comme je vous ai aimés.', reference: 'Jean 15:12', answer: 'aimés' },
          { text: 'La foi est une ferme assurance des choses qu\'on espère.', reference: 'Hébreux 11:1', answer: 'ferme' },
          { text: 'La parole de Dieu est vivante et efficace.', reference: 'Hébreux 4:12', answer: 'vivante' },
          { text: 'Confie-toi en l\'Éternel de tout ton cœur.', reference: 'Proverbes 3:5', answer: 'Confie' },
          { text: 'Celui qui demeure sous l\'abri du Très-Haut repose à l\'ombre du Tout-Puissant.', reference: 'Psaume 91:1', answer: 'abri' },
        ],
        difficulty,
        xp: 50 * difficulty,
      };
    }

    const questions: any[] = [];
    const usedIds = new Set<string>();
    let attempts = 0;
    const maxAttempts = 200;

    while (questions.length < 10 && attempts < maxAttempts) {
      attempts++;
      const skip = Math.floor(Math.random() * count);
      if (usedIds.has(skip.toString())) continue;
      usedIds.add(skip.toString());

      const verse = await this.prisma.bibleVerse.findFirst({
        skip,
        take: 1,
        include: { book: true },
      });
      if (!verse) continue;

      const words = verse.text.split(' ');
      const validIndexes = words
        .map((w, idx) => ({ word: w, index: idx }))
        .filter((x) => x.word.length > 2 && /^[A-Za-zÀ-ÿ'-]+$/.test(x.word));
      if (validIndexes.length === 0) continue;

      const randomIdx = Math.floor(Math.random() * validIndexes.length);
      const { word: maskedWord, index: wordIndex } = validIndexes[randomIdx];
      const displayWords = [...words];
      displayWords[wordIndex] = '_____';

      questions.push({
        text: displayWords.join(' '),
        reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
        answer: maskedWord,
      });
    }

    while (questions.length < 10) {
      questions.push({
        text: 'Question de secours : Quel est le premier livre de la Bible ?',
        reference: 'Général',
        answer: 'Genèse',
      });
    }

    return {
      type: 'speed',
      timeLimit,
      questions: questions.slice(0, 10),
      difficulty,
      xp: 50 * difficulty,
    };
  }

  // ---------- 12. ASSOCIATION ----------
  async getAssociationGame(): Promise<any> {
    const themes = ['Amour', 'Foi', 'Espérance', 'Pardon', 'Grâce', 'Paix', 'Jésus', 'Dieu'];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    const verses = await this.prisma.bibleVerse.findMany({
      where: { text: { contains: theme } },
      take: 50,
      include: { book: true },
    });

    if (verses.length < 4) return this.getAssociationGame();

    const shuffled = verses.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    const correct = selected[0].text;
    const fakeChoices = selected.slice(1, 4).map((v: any) => v.text);
    const choices = [correct, ...fakeChoices].sort(() => Math.random() - 0.5);

    return {
      type: 'associate',
      question: `🔗 Associe ce verset au thème "${theme}" :`,
      text: correct,
      choices,
      answer: correct,
      reference: selected.map((v: any) => `${v.book.nameFr} ${v.chapter}:${v.verse}`).join(', '),
      xp: 80,
      difficulty: 3,
    };
  }

  // ---------- 13. MÉMOIRE ----------
  async getMemoryGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;

    const verses: any[] = [];
    const usedSkips = new Set();
    for (let i = 0; i < 4; i++) {
      let skip = Math.floor(Math.random() * count);
      while (usedSkips.has(skip)) skip = (skip + 1) % count;
      usedSkips.add(skip);
      const verse = await this.prisma.bibleVerse.findFirst({
        skip,
        take: 1,
        include: { book: true },
      });
      if (verse) verses.push(verse);
    }

    if (verses.length < 2) return this.getMemoryGame();

    const target = verses[0];
    const choices = verses.map((v: any) => ({
      text: v.text,
      reference: `${v.book.nameFr} ${v.chapter}:${v.verse}`,
    }));

    return {
      type: 'memory',
      question: '🧠 Souviens-toi du verset affiché !',
      text: target.text,
      choices: choices.map((c) => c.text),
      answer: target.text,
      references: choices.map((c) => c.reference),
      xp: 60,
      difficulty: Math.min(Math.floor(target.chapter / 10) + 1, 5),
    };
  }

  // ---------- 14. COMPLÈTE LE CHAPITRE ----------
  async getOrderGame(): Promise<any> {
    const count = await this.prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    const verses: any[] = await this.prisma.bibleVerse.findMany({
      skip,
      take: 5,
      include: { book: true },
      orderBy: { chapter: 'asc' },
    });

    if (verses.length < 3) return this.getOrderGame();

    const correctOrder = verses.map((v: any) => ({
      text: v.text,
      reference: `${v.book.nameFr} ${v.chapter}:${v.verse}`,
      order: v.chapter,
    }));

    const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);

    return {
      type: 'order',
      question: '📖 Remets ces versets dans l\'ordre du chapitre (du plus petit au plus grand)',
      verses: shuffled.map((v, idx) => ({
        id: idx,
        text: v.text,
        reference: v.reference,
      })),
      answer: correctOrder.map((v) => v.reference),
      xp: 120,
      difficulty: 4,
    };
  }

  // ---------- 15. QUIZ DU JOUR ----------
  async getDailyQuiz(userId?: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daily = await this.prisma.dailyChallenge.findFirst({
      where: { date: today },
      include: { game: true },
    });

    if (!daily) {
      const count = await this.prisma.bibleVerse.count();
      const questions: any[] = [];
      const usedIds = new Set<string>();
      let attempts = 0;
      const maxAttempts = 100;

      while (questions.length < 5 && attempts < maxAttempts) {
        attempts++;
        const skip = Math.floor(Math.random() * count);
        if (usedIds.has(skip.toString())) continue;
        usedIds.add(skip.toString());

        const verse = await this.prisma.bibleVerse.findFirst({
          skip,
          take: 1,
          include: { book: true },
        });
        if (!verse) continue;

        const words = verse.text.split(' ');
        const validIndexes = words
          .map((w, idx) => ({ word: w, index: idx }))
          .filter((x) => x.word.length > 2 && /^[A-Za-zÀ-ÿ'-]+$/.test(x.word));
        if (validIndexes.length === 0) continue;

        const randomIdx = Math.floor(Math.random() * validIndexes.length);
        const { word: maskedWord, index: wordIndex } = validIndexes[randomIdx];
        const displayWords = [...words];
        displayWords[wordIndex] = '_____';

        const fakeWords = await this.prisma.bibleVerse.findMany({
          select: { text: true },
          take: 100,
        });
        const wordSet = new Set<string>();
        for (const v of fakeWords) {
          const w = v.text.split(' ');
          for (const ww of w) {
            if (ww.length > 2 && /^[A-Za-zÀ-ÿ'-]+$/.test(ww)) {
              wordSet.add(ww);
            }
          }
        }
        const wordList = Array.from(wordSet).sort(() => Math.random() - 0.5);
        const candidates = wordList.filter((w) => w !== maskedWord && w.length > 2);
        const fakeChoices = candidates.slice(0, 3);
        while (fakeChoices.length < 3) {
          const fallback = ['amour', 'foi', 'paix', 'grâce', 'pardon'];
          const f = fallback[Math.floor(Math.random() * fallback.length)];
          if (!fakeChoices.includes(f)) fakeChoices.push(f);
        }
        const choices = [maskedWord, ...fakeChoices].sort(() => Math.random() - 0.5);

        questions.push({
          text: displayWords.join(' '),
          reference: `${verse.book.nameFr} ${verse.chapter}:${verse.verse}`,
          answer: maskedWord,
          choices,
        });
      }

      while (questions.length < 5) {
        questions.push({
          text: 'Quel est le premier livre de la Bible ? (choisis le bon mot)',
          reference: 'Général',
          answer: 'Genèse',
          choices: ['Genèse', 'Exode', 'Lévitique', 'Nombres'],
        });
      }

      const game = await this.prisma.bibleGame.create({
        data: {
          type: 'daily',
          question: JSON.stringify(questions),
          answer: 'daily_quiz',
          difficulty: 3,
          xp: 100,
        },
      });

      daily = await this.prisma.dailyChallenge.create({
        data: {
          date: today,
          gameId: game.id,
          completedBy: '[]',
        },
        include: { game: true },
      });
    }

    let completedBy: string[] = [];
    try {
      completedBy = JSON.parse(daily.completedBy || '[]');
    } catch {
      completedBy = [];
    }

    const completed = userId ? completedBy.includes(userId) : false;
    let questions: any[] = [];
    try {
      questions = JSON.parse(daily.game.question);
    } catch {
      questions = [];
    }

    return {
      ...daily.game,
      questions,
      completed,
      totalQuestions: questions.length,
    };
  }

  // ---------- 16. CLASSEMENT MENSUEL ----------
  async getLeaderboard(month?: string, year?: string): Promise<any> {
    const now = new Date();
    const currentMonth = parseInt(month || String(now.getMonth() + 1), 10);
    const currentYear = parseInt(year || String(now.getFullYear()), 10);

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 1);

    const attempts = await this.prisma.bibleGameAttempt.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const userScores: Record<string, { firstName: string; lastName: string; totalScore: number; totalGames: number }> = {};

    for (const attempt of attempts) {
      const userId = attempt.userId;
      if (!userScores[userId]) {
        userScores[userId] = {
          firstName: attempt.user.firstName,
          lastName: attempt.user.lastName,
          totalScore: 0,
          totalGames: 0,
        };
      }
      userScores[userId].totalScore += attempt.score;
      userScores[userId].totalGames += 1;
    }

    const leaderboard = Object.entries(userScores)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);

    return {
      month: currentMonth,
      year: currentYear,
      leaderboard,
    };
  }

  // ---------- 17. RECORD TENTATIVE ----------
  async recordAttempt(userId: string, gameType: string, score: number, total: number, time?: number) {
    const game = await this.prisma.bibleGame.findFirst({
      where: { type: gameType },
    });
    if (!game) {
      const newGame = await this.prisma.bibleGame.create({
        data: {
          type: gameType,
          question: `Jeu ${gameType}`,
          answer: 'generic',
          xp: 50,
        },
      });
      return this.prisma.bibleGameAttempt.create({
        data: {
          userId,
          gameId: newGame.id,
          score,
          total,
          time,
        },
      });
    }

    return this.prisma.bibleGameAttempt.create({
      data: {
        userId,
        gameId: game.id,
        score,
        total,
        time,
      },
    });
  }

  // ---------- 18. STATISTIQUES ----------
  async getUserStats(userId: string) {
    const attempts = await this.prisma.bibleGameAttempt.findMany({
      where: { userId },
      include: { game: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
    const totalGames = attempts.length;
    const correct = attempts.filter((a) => a.score === a.total).length;

    return {
      totalGames,
      totalScore,
      averageScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0,
      successRate: totalGames > 0 ? Math.round((correct / totalGames) * 100) : 0,
      attempts,
    };
  }
}