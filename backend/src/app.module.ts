import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostsModule } from './posts/posts.module';
import { UploadModule } from './upload/upload.module';
import { IaModule } from './ia/ia.module';
import { EventsModule } from './events/events.module';
import { GamesModule } from './games/games.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { PrayersModule } from './prayers/prayers.module';
import { LibraryModule } from './library/library.module';
import { ChallengesModule } from './challenges/challenges.module';
import { ReadingPlansModule } from './reading-plans/reading-plans.module';
import { StatsModule } from './stats/stats.module';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [AuthModule, PrismaModule, PostsModule, UploadModule, IaModule, EventsModule,GamesModule, WorkshopsModule, PrayersModule, LibraryModule, ChallengesModule, ReadingPlansModule, StatsModule, ChatModule],
  // ...
 controllers: [],
  providers: [],
})
export class AppModule {}