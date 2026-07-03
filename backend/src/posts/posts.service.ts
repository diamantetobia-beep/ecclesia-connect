import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(authorId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Le contenu est requis.');
    }
    return this.prisma.post.create({
      data: { content, authorId },
      include: { author: true, comments: true, likes: true },
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        comments: { include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
        likes: true,
      },
    });
  }

  async addComment(postId: string, authorId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Le commentaire est requis.');
    }
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new BadRequestException('Publication introuvable.');
    return this.prisma.comment.create({
      data: { content, authorId, postId },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new BadRequestException('Publication introuvable.');
    const existing = await this.prisma.like.findFirst({ where: { postId, userId } });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { message: 'Like retiré.' };
    } else {
      await this.prisma.like.create({ data: { postId, userId } });
      return { message: 'Like ajouté.' };
    }
  }
}