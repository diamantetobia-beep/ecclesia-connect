import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Super Admin')
  async create(@Request() req, @Body() body: any) {
    return this.challengesService.create(req.user.id, body);
  }

  @Get()
  async findAll() {
    return this.challengesService.findAll();
  }

  @Get('daily')
  async getDailyChallenge(@Request() req) {
    return this.challengesService.getDailyChallenge(req.user.id);
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    return this.challengesService.getUserStats(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Post(':id/participate')
  async participate(@Param('id') id: string, @Request() req) {
    return this.challengesService.participate(id, req.user.id);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Request() req) {
    return this.challengesService.complete(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin')
  async remove(@Param('id') id: string, @Request() req) {
    return this.challengesService.remove(id, req.user.id);
  }
 @Get('today')
async getTodayChallenge(@Request() req) {
  return this.challengesService.getTodayChallenge(req.user.id);
}
 
}