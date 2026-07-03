import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentService {
  // Tout est désormais orienté application
  detect(_query: string): 'app' {
    return 'app';
  }

  // Extraire le sujet de la question
  extractTopic(query: string): string {
    const stopWords = [
      'comment', 'pourquoi', 'quand', 'où', 'quoi', 'qui', 'est-ce que',
      'je veux', 'je cherche', 'explique', 'dis-moi', 'montre-moi', 'aide-moi',
      'quel est', 'quelle est', 'le', 'la', 'les', 'des', 'un', 'une',
      'à', 'de', 'pour', 'par', 'sur', 'dans', 'avec', 'sans',
    ];
    let topic = query;
    for (const word of stopWords) {
      topic = topic.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }
    return topic.trim() || query;
  }

  // Détecter le type d'action demandée
  detectAction(query: string): 'guide' | 'explain' | 'find' | 'search' {
    const lower = query.toLowerCase();
    if (lower.includes('comment') || lower.includes('guide') || lower.includes('étape')) {
      return 'guide';
    }
    if (lower.includes('c\'est quoi') || lower.includes('qu\'est-ce que') || lower.includes('explique')) {
      return 'explain';
    }
    if (lower.includes('cherche') || lower.includes('trouve') || lower.includes('recherche')) {
      return 'find';
    }
    return 'search';
  }

  // ✅ Vérifier si la question concerne une action spécifique
  isActionQuery(query: string): boolean {
    const actionWords = ['comment', 'guide', 'étape', 'créer', 'modifier', 'supprimer', 'rejoindre', 'quitter'];
    const lower = query.toLowerCase();
    return actionWords.some(word => lower.includes(word));
  }
}