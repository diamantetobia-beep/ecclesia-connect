import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController { // ✅ Export avec majuscule
  constructor(private chatService: ChatService) {}

  @Post('conversations/private/:userId')
  async createPrivateConversation(@Request() req, @Param('userId') otherUserId: string) {
    return this.chatService.createPrivateConversation(req.user.id, otherUserId);
  }

  @Post('conversations/group')
  async createGroup(@Request() req, @Body() body: { name: string; memberIds: string[] }) {
    return this.chatService.createGroup(req.user.id, body.name, body.memberIds);
  }

  @Get('conversations')
  async getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string, @Request() req) {
    return this.chatService.getMessages(id, req.user.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { content: string; fileUrl?: string; fileType?: string },
  ) {
    return this.chatService.sendMessage(id, req.user.id, body.content, body.fileUrl, body.fileType);
  }

  @Post('messages/:id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  @Post('conversations/:id/read-all')
  async markAllAsRead(@Param('id') id: string, @Request() req) {
    return this.chatService.markAllAsRead(id, req.user.id);
  }

  @Get('unread')
  async getUnreadCount(@Request() req) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Get('users')
  async getUsers(@Request() req) {
    return this.chatService.getUsersForChat(req.user.id);
  }
}