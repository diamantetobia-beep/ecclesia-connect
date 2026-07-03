import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('workshops')
@UseGuards(JwtAuthGuard)
export class WorkshopsController {
  constructor(private workshopsService: WorkshopsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Super Admin')
  async create(@Request() req, @Body() body: any) {
    return this.workshopsService.create(req.user.id, body);
  }

  @Get()
  async findAll() {
    return this.workshopsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workshopsService.findOne(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.workshopsService.getMembers(id);
  }

  @Get(':id/pending')
  async getPendingRequests(@Param('id') id: string, @Request() req) {
    return this.workshopsService.getPendingRequests(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async update(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.workshopsService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async remove(@Param('id') id: string, @Request() req) {
    return this.workshopsService.remove(id, req.user.id);
  }

  @Post(':id/join')
  async requestJoin(@Param('id') id: string, @Request() req) {
    return this.workshopsService.requestJoin(id, req.user.id);
  }

  @Post(':id/approve/:userId')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async approveMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.workshopsService.approveMember(id, userId, req.user.id);
  }

  @Post(':id/reject/:userId')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async rejectMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.workshopsService.rejectMember(id, userId, req.user.id);
  }

  @Post(':id/leave')
  async leave(@Param('id') id: string, @Request() req) {
    return this.workshopsService.leave(id, req.user.id);
  }

  @Post(':id/chat')
  async addChat(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.workshopsService.addChat(id, req.user.id, body.message, body.fileUrl, body.fileType);
  }

  @Post(':id/schedule')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async addSchedule(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.workshopsService.addSchedule(id, req.user.id, body);
  }

  @Delete('schedule/:scheduleId')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async removeSchedule(@Param('scheduleId') scheduleId: string, @Request() req) {
    return this.workshopsService.removeSchedule(scheduleId, req.user.id);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async addArchive(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.workshopsService.addArchive(id, req.user.id, body);
  }

  @Delete('archive/:archiveId')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async removeArchive(@Param('archiveId') archiveId: string, @Request() req) {
    return this.workshopsService.removeArchive(archiveId, req.user.id);
  }
}