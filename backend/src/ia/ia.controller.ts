import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IaService } from './ia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Contrôleur de l'assistant IA
 * Tous les endpoints sont protégés par JWT
 */
@Controller('ia')
@UseGuards(JwtAuthGuard)
export class IaController {
  constructor(private iaService: IaService) {}

  /**
   * Point d'entrée principal de l'assistant
   * Utilisé par le frontend via /ia/ask
   */
  @Post('ask')
  async ask(@Body('query') query: string, @Request() req) {
    if (!query || query.trim().length === 0) {
      return { response: 'Veuillez poser une question.' };
    }
    const response = await this.iaService.ask(query, req.user.id);
    return { response };
  }

  /**
   * Compatibilité avec l'ancien endpoint /ia/bible
   * Redirige vers le même service (assistant application)
   */
  @Post('bible')
  async askBible(@Body('query') query: string, @Request() req) {
    if (!query || query.trim().length === 0) {
      return { response: 'Veuillez poser une question.' };
    }
    const response = await this.iaService.ask(query, req.user.id);
    return { response };
  }

  /**
   * Compatibilité avec l'ancien endpoint /ia/app
   * Redirige vers le même service (assistant application)
   */
  @Post('app')
  async askApp(@Body('query') query: string, @Request() req) {
    if (!query || query.trim().length === 0) {
      return { response: 'Veuillez poser une question.' };
    }
    const response = await this.iaService.ask(query, req.user.id);
    return { response };
  }
}