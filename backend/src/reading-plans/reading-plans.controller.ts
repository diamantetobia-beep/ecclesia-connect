import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ReadingPlansService } from './reading-plans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reading-plans')
@UseGuards(JwtAuthGuard)
export class ReadingPlansController {
  constructor(private readonly readingPlansService: ReadingPlansService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async create(@Request() req, @Body() body: any) {
    return this.readingPlansService.create(req.user.id, body);
  }

  @Get()
  async findAll() {
    return this.readingPlansService.findAll();
  }

  @Get('my-progress')
  async getMyProgress(@Request() req) {
    return this.readingPlansService.getMyProgress(req.user.id);
  }

  @Get('verse-of-the-day')
  async getVerseOfTheDay() {
    return this.readingPlansService.getVerseOfTheDay();
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    return this.readingPlansService.getUserStats(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.readingPlansService.findOne(id, req.user.id);
  }

  @Post(':id/read-next')
  async readNext(@Param('id') id: string, @Request() req) {
    return this.readingPlansService.readNext(id, req.user.id);
  }

  @Post(':id/reset')
  async resetProgress(@Param('id') id: string, @Request() req) {
    return this.readingPlansService.resetProgress(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async remove(@Param('id') id: string, @Request() req) {
    return this.readingPlansService.remove(id, req.user.id);
  }
}