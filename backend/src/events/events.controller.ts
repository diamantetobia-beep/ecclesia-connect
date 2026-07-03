import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async create(@Request() req, @Body() body: any) {
    return this.eventsService.create(req.user.id, body);
  }

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async update(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.eventsService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async remove(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id, req.user.id);
  }

  @Post(':id/register')
  async register(@Param('id') id: string, @Request() req) {
    return this.eventsService.register(id, req.user.id);
  }

  @Delete(':id/unregister')
  async unregister(@Param('id') id: string, @Request() req) {
    return this.eventsService.unregister(id, req.user.id);
  }
}