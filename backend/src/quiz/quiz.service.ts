import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async generateQuiz(category?: string, difficulty?: number): Promise<any> {
    const where: any = {};
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const count = await this.prisma.bibleQuiz.count({ where });
    if (count === 0) {
      // Si pas de questions en base, générer une question "dummy"
      return this.generateDummyQuiz();
    }

    const skip = Math.floor(Math.random() * count);
    const quiz = await this.prisma.bibleQuiz.findFirst({
      where,
      skip,
      take: 1,
    });

    return quiz;
  }

  private generateDummyQuiz() {
    return {
      question: 'Qui succéda à Moïse ?',
      choices: ['Josué', 'David', 'Samuel', 'Aaron'],
      answer: 'Josué',
      difficulty: 1,
      category: 'Ancien Testament',
      xp: 150,
    };
  }

  async recordAttempt(userId: string, quizId: string, score: number, total: number) {
    return this.prisma.quizAttempt.create({
      data: { userId, quizId, score, total },
    });
  }
}