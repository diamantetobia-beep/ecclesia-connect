import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ---------- CRÉER UNE CONVERSATION PRIVÉE ----------
  async createPrivateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Vous ne pouvez pas discuter avec vous-même.');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'private',
        participants: {
          every: {
            userId: { in: [userId, otherUserId] },
          },
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
      },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        type: 'private',
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
      },
    });
  }

  // ---------- CRÉER UN GROUPE ----------
  async createGroup(userId: string, name: string, memberIds: string[]) {
    if (!name || memberIds.length === 0) {
      throw new BadRequestException('Nom du groupe et membres requis.');
    }

    const uniqueMembers = [...new Set([userId, ...memberIds])];

    return this.prisma.conversation.create({
      data: {
        type: 'group',
        name,
        participants: {
          create: uniqueMembers.map(id => ({ userId: id })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
      },
    });
  }

  // ---------- LISTER LES CONVERSATIONS D'UN UTILISATEUR ----------
  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ---------- RÉCUPÉRER LES MESSAGES D'UNE CONVERSATION ----------
  async getMessages(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conv) throw new NotFoundException('Conversation introuvable.');
    if (!conv.participants.some(p => p.userId === userId)) {
      throw new BadRequestException('Vous n\'êtes pas membre de cette conversation.');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(msg => ({
      ...msg,
      readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
    }));
  }

  // ---------- ENVOYER UN MESSAGE ----------
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    fileUrl?: string,
    fileType?: string,
  ) {
    if (!content && !fileUrl) {
      throw new BadRequestException('Message ou fichier requis.');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conv) throw new NotFoundException('Conversation introuvable.');
    if (!conv.participants.some(p => p.userId === senderId)) {
      throw new BadRequestException('Vous n\'êtes pas membre de cette conversation.');
    }

    const message = await this.prisma.message.create({
      data: {
        content: content || '',
        fileUrl,
        fileType,
        senderId,
        conversationId,
        readBy: JSON.stringify([senderId]),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      ...message,
      readBy: JSON.parse(message.readBy),
    };
  }

  // ---------- MARQUER UN MESSAGE COMME LU ----------
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!message) throw new NotFoundException('Message introuvable.');
    if (!message.conversation.participants.some(p => p.userId === userId)) {
      throw new BadRequestException('Vous n\'êtes pas membre de cette conversation.');
    }

    const readByArray = message.readBy ? JSON.parse(message.readBy) : [];
    if (!readByArray.includes(userId)) {
      readByArray.push(userId);
      await this.prisma.message.update({
        where: { id: messageId },
        data: { readBy: JSON.stringify(readByArray) },
      });
    }
    return { message: 'Message marqué comme lu.' };
  }

  // ---------- MARQUER TOUS LES MESSAGES D'UNE CONVERSATION COMME LUS ----------
  async markAllAsRead(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conv) throw new NotFoundException('Conversation introuvable.');
    if (!conv.participants.some(p => p.userId === userId)) {
      throw new BadRequestException('Vous n\'êtes pas membre de cette conversation.');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
    });

    for (const msg of messages) {
      const readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
      if (!readByArray.includes(userId)) {
        readByArray.push(userId);
        await this.prisma.message.update({
          where: { id: msg.id },
          data: { readBy: JSON.stringify(readByArray) },
        });
      }
    }

    return { message: 'Tous les messages marqués comme lus.' };
  }

  // ---------- COMPTER LES MESSAGES NON LUS ----------
  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        messages: true,
      },
    });

    let count = 0;
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        const readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
        if (!readByArray.includes(userId) && msg.senderId !== userId) {
          count++;
        }
      }
    }
    return { unread: count };
  }

  // ---------- LISTER LES UTILISATEURS POUR LE CHAT ----------
  async getUsersForChat(userId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        photoUrl: true,
        role: { select: { name: true } },
      },
    });
  }
}