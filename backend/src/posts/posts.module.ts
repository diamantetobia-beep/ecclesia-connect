import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '../prisma/prisma.module'; // ← import

@Module({
  imports: [PrismaModule], // ← ajoute cette ligne
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}