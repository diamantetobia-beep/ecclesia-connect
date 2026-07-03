import { Module } from '@nestjs/common';
import { ReadingPlansService } from './reading-plans.service';
import { ReadingPlansController } from './reading-plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReadingPlansController],
  providers: [ReadingPlansService],
})
export class ReadingPlansModule {}