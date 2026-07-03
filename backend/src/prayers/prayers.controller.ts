import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PrayersService } from './prayers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('prayers')
@UseGuards(JwtAuthGuard)
export class PrayersController {
  constructor(private prayersService: PrayersService) {}

  @Post()
  async create(@Request() req, @Body() body: { title: string; content: string }) {
    return this.prayersService.create(req.user.id, body);
  }

  @Get()
  async findAll() {
    return this.prayersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prayersService.findOne(id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Request() req,
    @Body('content') content: string,
  ) {
    return this.prayersService.addComment(id, req.user.id, content);
  }

  @Post(':id/pray')
  async togglePray(@Param('id') id: string, @Request() req) {
    return this.prayersService.togglePray(id, req.user.id);
  }

  @Patch(':id/answered')
  async markAnswered(@Param('id') id: string, @Request() req) {
    return this.prayersService.markAnswered(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.prayersService.remove(id, req.user.id);
  }
}