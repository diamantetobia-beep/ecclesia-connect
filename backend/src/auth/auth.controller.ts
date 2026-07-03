import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Param, Delete, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.photoUrl,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Patch('activate/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin')
  async activateUser(@Param('userId') userId: string) {
    return this.authService.activateUser(userId);
  }

  // ✅ Route pour rejeter un compte
  @Delete('admin/users/:userId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin')
  async rejectUser(@Param('userId') userId: string) {
    return this.authService.rejectUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() body: any) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin')
  @Get('admin/users')
  async getUsers() {
    return this.authService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin')
  @Patch('admin/users/:userId/activate')
  async adminActivateUser(@Param('userId') userId: string) {
    return this.authService.activateUser(userId);
  }
}