// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS pentru frontend
  app.enableCors({
    origin: 'https://portfolio.absolutions.ro',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configurare pentru uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Setare prefix pentru toate rutele API
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();