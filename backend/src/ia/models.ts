// ---------- RÉPONSES MODÈLES ----------
export const modelAnswers: Record<string, string> = {
  // Fonctionnement de l'application
  'comment créer un compte': 'Pour créer un compte, clique sur "Inscris-toi" depuis la page de connexion, remplis tes informations, puis attends la validation par un administrateur.',
  'comment se connecter': 'Utilise ton email et mot de passe sur la page de connexion. Si tu as oublié ton mot de passe, contacte un administrateur.',
  'comment publier': 'Va sur le Fil d\'actualité, écris ton message et clique sur "Publier". Tu peux partager témoignages, versets ou réflexions.',
  'comment rejoindre un atelier': 'Va dans la section Ateliers, choisis celui qui t\'intéresse et demande à y être inscrit via le responsable.',
  'comment s\'inscrire à un événement': 'Dans la page Événements, clique sur "S\'inscrire" pour l\'événement de ton choix.',
  'comment prier pour quelqu\'un': 'Va dans la section Demandes de prière, trouve la demande et clique sur "Je prie pour toi".',
  'comment gérer mon profil': 'Rends-toi dans "Mon Profil" pour modifier tes informations personnelles et ta photo.',

  // Sujets bibliques (modèles pour les questions fréquentes)
  'foi': 'La foi est une confiance totale en Dieu et en sa Parole. Elle est la certitude des choses qu\'on espère, une démonstration de celles qu\'on ne voit pas (Hébreux 11:1). Elle nous permet de vivre selon la volonté de Dieu et de recevoir ses promesses.',
  'amour': 'L\'amour selon la Bible est patient, bon, il ne jalouse pas, ne s\'enorgueillit pas, ne se fâche pas, ne tient pas compte du mal (1 Corinthiens 13:4-7). L\'amour parfait vient de Dieu, car Dieu est amour (1 Jean 4:8).',
  'pardon': 'Le pardon est un acte de grâce par lequel Dieu efface nos péchés et nous réconcilie avec lui. Nous sommes appelés à pardonner aux autres comme Dieu nous a pardonnés (Éphésiens 4:32).',
  'prière': 'La prière est une communication avec Dieu. C\'est l\'occasion de lui parler, de l\'écouter, de lui présenter nos demandes et de lui rendre grâce. La Bible encourage à prier sans cesse (1 Thessaloniciens 5:17).',
  'espérance': 'L\'espérance chrétienne est une attente confiante du retour de Christ et de la vie éternelle. Elle est une ancre sûre pour l\'âme (Hébreux 6:19).',
  'grâce': 'La grâce est la faveur imméritée de Dieu. C\'est par la grâce que nous sommes sauvés, par le moyen de la foi (Éphésiens 2:8).',
  'paix': 'La paix de Dieu est une paix intérieure qui surpasse toute intelligence. Elle garde nos cœurs et nos pensées en Jésus-Christ (Philippiens 4:7).',
};

// ---------- SCHÉMA DE RÉPONSE ----------
export interface BibleResponse {
  introduction: string;
  verses: string[];
  explanation: string;
  conclusion: string;
}

export function buildBibleResponse(theme: string, verses: any[]): BibleResponse {
  const verseTexts = verses.slice(0, 3).map(v => `${v.book.nameFr} ${v.chapter}:${v.verse} – "${v.text}"`);

  return {
    introduction: `📖 La Bible parle du thème "${theme}" à travers plusieurs passages.`,
    verses: verseTexts,
    explanation: `Ces versets nous montrent que ${theme} est au cœur du message biblique. Dieu nous invite à vivre pleinement cette réalité dans notre vie quotidienne.`,
    conclusion: `💰 Médite sur ces versets et laisse la Parole de Dieu transformer ton cœur.`,
  };
}