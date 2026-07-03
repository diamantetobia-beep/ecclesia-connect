import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req, @Body('content') content: string) {
    return this.postsService.createPost(req.user.id, content);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.postsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  async addComment(@Param('postId') postId: string, @Request() req, @Body('content') content: string) {
    return this.postsService.addComment(postId, req.user.id, content);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/like')
  async toggleLike(@Param('postId') postId: string, @Request() req) {
    return this.postsService.toggleLike(postId, req.user.id);
  }
}