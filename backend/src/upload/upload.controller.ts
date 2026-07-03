import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('workshop-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadWorkshopImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.saveWorkshopImage(file);
    return { url };
  }
}