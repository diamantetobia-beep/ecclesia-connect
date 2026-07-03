import { Controller, Get, Post, Param, UseGuards, Request, Body, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get('completion')
  async getCompletion(@Request() req) {
    return this.gamesService.getCompletionGame();
  }

  @Get('who-said')
  async getWhoSaid(@Request() req) {
    return this.gamesService.getWhoSaidGame();
  }

  @Get('book')
  async getBook(@Request() req) {
    return this.gamesService.getBookGame();
  }

  @Get('chapter')
  async getChapter(@Request() req) {
    return this.gamesService.getChapterGame();
  }

  @Get('guess')
  async getGuess(@Request() req) {
    return this.gamesService.getGuessGame();
  }

  @Get('fill')
  async getFill(@Query('difficulty') difficulty: string) {
    return this.gamesService.getFillGame(parseInt(difficulty) || 1);
  }

  @Get('speed')
  async getSpeed(@Query('difficulty') difficulty: string) {
    return this.gamesService.getSpeedGame(parseInt(difficulty) || 1);
  }

  @Get('associate')
  async getAssociate(@Request() req) {
    return this.gamesService.getAssociationGame();
  }

  @Get('find')
  async getFind(@Request() req) {
    return this.gamesService.getFindGame();
  }

  @Get('truefalse')
  async getTrueFalse(@Request() req) {
    return this.gamesService.getTrueFalseGame();
  }

  @Get('order')
  async getOrder(@Request() req) {
    return this.gamesService.getOrderGame();
  }

  @Get('memory')
  async getMemory(@Request() req) {
    return this.gamesService.getMemoryGame();
  }

  @Get('whoami')
  async getWhoAmI(@Request() req) {
    return this.gamesService.getWhoAmIGame();
  }

  @Get('random')
  async getRandom(@Request() req) {
    return this.gamesService.getRandomGame();
  }

  @Post('attempt')
  async recordAttempt(@Request() req, @Body() body: any) {
    return this.gamesService.recordAttempt(
      req.user.id,
      body.gameType,
      body.score,
      body.total,
      body.time,
    );
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.gamesService.getUserStats(req.user.id);
  }
  @Get('daily')
async getDaily(@Request() req) {
  return this.gamesService.getDailyQuiz(req.user.id);
}
@Get('leaderboard')
async getLeaderboard(@Query('month') month?: string, @Query('year') year?: string) {
  return this.gamesService.getLeaderboard(month, year);
}
}