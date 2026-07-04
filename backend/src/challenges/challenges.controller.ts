import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './create-challenge.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
// ✅ Import de type pour Request
import type { Request } from 'express';

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  async getAll(
    @Query('category') category?: string,
    @Query('frequency') frequency?: string,
  ) {
    return this.challengesService.findAll(category, frequency);
  }

  @Get('today')
  async getToday() {
    return this.challengesService.getToday();
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const userId = req.user?.['id'];
    if (!userId) throw new UnauthorizedException('Non authentifié');
    return this.challengesService.getUserStats(userId);
  }

  @Post()
  @Roles('superadmin')
  @UseGuards(RolesGuard)
  async create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Post(':id/participate')
  async participate(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['id'];
    if (!userId) throw new UnauthorizedException('Non authentifié');
    return this.challengesService.participate(id, userId);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['id'];
    if (!userId) throw new UnauthorizedException('Non authentifié');
    return this.challengesService.complete(id, userId);
  }
}