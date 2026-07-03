import { Injectable } from '@nestjs/common';
import { IntentService } from './intent.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IaService {
  constructor(
    private intentService: IntentService,
    private prisma: PrismaService,
  ) {}

  async ask(query: string, userId: string): Promise<string> {
    const action = this.intentService.detectAction(query);
    const topic = this.intentService.extractTopic(query);

    // 1. Si c'est une question d'action (comment faire), on donne un guide
    if (this.intentService.isActionQuery(query)) {
      const guide = this.getActionGuide(query);
      if (guide) return guide;
    }

    // 2. Recherche dans les données de l'application
    const searchResult = await this.searchInApp(topic, userId);

    // 3. Si un résultat est trouvé, on le retourne
    if (searchResult) {
      return searchResult;
    }

    // 4. Sinon, réponse générique
    return this.getFallbackResponse(query);
  }

  // ---------- GUIDES D'ACTION ----------
  private getActionGuide(query: string): string | null {
    const lower = query.toLowerCase();

    if (lower.includes('créer un compte') || lower.includes('inscription')) {
      return this.guideCreateAccount();
    }
    if (lower.includes('se connecter') || lower.includes('connexion')) {
      return this.guideLogin();
    }
    if (lower.includes('envoyer un message') || lower.includes('message') || lower.includes('discuter')) {
      return this.guideSendMessage();
    }
    if (lower.includes('rejoindre un atelier') || lower.includes('atelier')) {
      return this.guideJoinWorkshop();
    }
    if (lower.includes('créer un atelier')) {
      return this.guideCreateWorkshop();
    }
    if (lower.includes('créer un événement') || lower.includes('événement')) {
      return this.guideCreateEvent();
    }
    if (lower.includes('profil') || lower.includes('modifier')) {
      return this.guideProfile();
    }
    if (lower.includes('jeu') || lower.includes('quiz')) {
      return this.guideGames();
    }
    if (lower.includes('assistant') || lower.includes('ia') || lower.includes('comment utiliser')) {
      return this.guideAssistant();
    }
    if (lower.includes('statistique') || lower.includes('stat')) {
      return this.guideStats();
    }
    return null;
  }

  private guideCreateAccount(): string {
    return '📝 **Créer un compte**\n' +
      '1. Va sur la page d\'inscription (lien "Inscris-toi")\n' +
      '2. Remplis : prénom, nom, email, mot de passe (min 6 caractères)\n' +
      '3. Télécharge une photo de profil (obligatoire – JPG/PNG, max 5 Mo)\n' +
      '4. Clique sur "S\'inscrire"\n' +
      '5. Un administrateur validera ton compte sous 24h\n' +
      '6. Tu recevras une confirmation par email';
  }

  private guideLogin(): string {
    return '🔐 **Se connecter**\n' +
      '1. Va sur la page de connexion\n' +
      '2. Entre ton email et ton mot de passe\n' +
      '3. Clique sur "Se connecter"\n' +
      '⚠️ Ton compte doit être activé (validé par un Super Admin)';
  }

  private guideSendMessage(): string {
    return '💬 **Envoyer un message**\n' +
      '1. Va dans "Messages" (Dashboard)\n' +
      '2. Choisis une conversation ou clique sur "Nouvelle discussion"\n' +
      '3. Sélectionne "Privé" (1-1) ou "Groupe"\n' +
      '4. Écris ton message et appuie sur Entrée\n' +
      '📎 Partage des fichiers : images, vidéos, audios, documents\n' +
      '🎙️ Enregistrement vocal disponible';
  }

  private guideJoinWorkshop(): string {
    return '🎵 **Rejoindre un atelier**\n' +
      '1. Va dans "Ateliers"\n' +
      '2. Parcours la liste des ateliers disponibles\n' +
      '3. Clique sur "Rejoindre"\n' +
      '4. Le responsable validera ta demande\n' +
      '5. Une fois approuvé, tu accèdes au chat, planning et archives';
  }

  private guideCreateWorkshop(): string {
    return '🎯 **Créer un atelier** (Super Admin uniquement)\n' +
      '1. Va dans "Ateliers" → "Créer un atelier"\n' +
      '2. Remplis : nom, catégorie, description, image (optionnelle)\n' +
      '3. Choisis un responsable\n' +
      '4. Clique sur "Créer l\'atelier"';
  }

  private guideCreateEvent(): string {
    return '📅 **Créer un événement** (Super Admin/Responsable)\n' +
      '1. Va dans "Événements" → "Créer un événement"\n' +
      '2. Remplis : titre, description, lieu, dates, type\n' +
      '3. Clique sur "Créer l\'événement"\n' +
      '4. Les membres pourront s\'inscrire';
  }

  private guideProfile(): string {
    return '👤 **Modifier ton profil**\n' +
      '1. Va dans "Mon profil"\n' +
      '2. Modifie : photo, nom, prénom, téléphone, quartier, profession, études\n' +
      '3. Ajoute tes talents et centres d\'intérêt (séparés par des virgules)\n' +
      '4. Clique sur "Enregistrer"';
  }

  private guideGames(): string {
    return '🎮 **Jeux bibliques**\n' +
      '1. Va dans "Jeux bibliques"\n' +
      '2. Choisis parmi : Quiz du jour, Course contre la montre, Qui a dit ?, etc.\n' +
      '3. Gagne des points et monte de niveau\n' +
      '4. Consulte le classement mensuel';
  }

  private guideAssistant(): string {
    return '🤖 **Assistant Ecclesia**\n' +
      '1. Pose-moi n\'importe quelle question sur l\'application\n' +
      '2. Je te guiderai étape par étape\n' +
      '3. Je peux rechercher : ateliers, événements, publications, bibliothèque\n' +
      '4. Je respecte tes droits d\'accès (données confidentielles protégées)';
  }

  private guideStats(): string {
    return '📊 **Statistiques**\n' +
      '1. Va dans "Statistiques" (Super Admin uniquement)\n' +
      '2. Vois : nombre de membres, ateliers, prières, événements\n' +
      '3. Consulte l\'activité récente et la répartition des rôles';
  }

  // ---------- RECHERCHE DANS L'APPLICATION ----------
  private async searchInApp(topic: string, userId: string): Promise<string | null> {
    const lower = topic.toLowerCase();
    const results: string[] = [];

    // 1. Ateliers (où l'utilisateur est membre ou responsable)
    const workshops = await this.prisma.workshop.findMany({
      where: {
        OR: [
          { leaderId: userId },
          { members: { some: { userId, status: 'approved' } } },
        ],
      },
      include: { leader: true, members: { include: { user: true } } },
    });

    for (const w of workshops) {
      if (w.name.toLowerCase().includes(lower) || w.description?.toLowerCase().includes(lower)) {
        results.push(`🎵 **${w.name}**\n📋 ${w.description || 'Aucune description'}\n👤 Responsable : ${w.leader.firstName} ${w.leader.lastName}\n👥 ${w.members.length} membres`);
      }
    }

    // 2. Événements à venir
    const events = await this.prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    for (const e of events) {
      if (e.title.toLowerCase().includes(lower) || e.description?.toLowerCase().includes(lower)) {
        results.push(`📅 **${e.title}**\n📋 ${e.description || ''}\n📆 ${new Date(e.startDate).toLocaleDateString()}\n📍 ${e.location || 'Lieu non précisé'}`);
      }
    }

    // 3. Publications
    const posts = await this.prisma.post.findMany({
      where: { content: { contains: lower } },
      take: 3,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });

    for (const p of posts) {
      results.push(`📝 **${p.author.firstName} ${p.author.lastName}** : "${p.content}"`);
    }

    // 4. Bibliothèque
    const library = await this.prisma.libraryItem.findMany({
      where: {
        OR: [
          { title: { contains: lower } },
          { description: { contains: lower } },
        ],
        isPublished: true,
      },
      take: 3,
    });

    for (const l of library) {
      results.push(`📚 **${l.title}** : ${l.description || ''} (${l.type})`);
    }

    // 5. Messages (conversations où l'utilisateur est membre)
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        messages: {
          where: { content: { contains: lower } },
          take: 3,
          include: { sender: true },
        },
      },
    });

    for (const conv of conversations) {
      for (const msg of conv.messages) {
        const convName = conv.name || 'Conversation';
        results.push(`💬 **${convName}** - ${msg.sender.firstName} ${msg.sender.lastName} : "${msg.content}"`);
      }
    }

    // 6. Demandes de prière
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
      results.push(`🙏 **${p.user.firstName} ${p.user.lastName}** : "${p.title}"`);
    }

    if (results.length === 0) return null;
    return `✅ **Voici ce que j'ai trouvé dans Ecclesia Connect :**\n\n${results.slice(0, 10).join('\n\n')}`;
  }

  // ---------- RÉPONSE GENERIQUE ----------
  private getFallbackResponse(query: string): string {
    return `📖 Je n'ai pas trouvé d'information précise sur **"${query}"** dans l'application.\n\n🔍 **Voici ce que je peux faire pour toi :**\n` +
      `- Expliquer comment utiliser une fonctionnalité (ex: "Comment créer un compte ?")\n` +
      `- Trouver des informations dans l'application (ex: "Atelier Chorale")\n` +
      `- Te guider dans les étapes d'une action\n` +
      `- Te donner des détails sur les événements à venir\n` +
      `- Rechercher des publications ou des ressources\n\n` +
      `💡 **Pose-moi une question plus précise !**`;
  }

  // Méthodes publiques
  async askBible(query: string, userId: string): Promise<string> {
    return this.ask(query, userId);
  }

  async askApp(query: string, userId: string): Promise<string> {
    return this.ask(query, userId);
  }
}