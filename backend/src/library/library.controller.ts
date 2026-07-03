import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async create(@Request() req, @Body() body: any) {
    return this.libraryService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Query('type') type?: string, @Query('category') category?: string) {
    return this.libraryService.findAll({ type, category });
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async findAllAdmin() {
    return this.libraryService.findAllAdmin();
  }

  @Get('types')
  async getTypes() {
    return this.libraryService.getTypes();
  }

  @Get('categories')
  async getCategories() {
    return this.libraryService.getCategories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.libraryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async update(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.libraryService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Responsable')
  async remove(@Param('id') id: string, @Request() req) {
    return this.libraryService.remove(id, req.user.id);
  }
}