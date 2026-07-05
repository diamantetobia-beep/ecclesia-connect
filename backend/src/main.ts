import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Servir le frontend buildé
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'build'));
  
  // Rediriger toutes les routes non-API vers index.html
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, '..', '..', 'frontend', 'build', 'index.html'));
    } else {
      next();
    }
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();