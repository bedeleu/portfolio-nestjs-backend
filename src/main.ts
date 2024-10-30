import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';
import { createCorsConfig } from './config/cors.config';
import { createPathConfig } from './config/paths.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurare paths
  const isProduction = configService.get('nodeEnv') === 'production';
  const paths = createPathConfig(isProduction);

  // Configurare CORS
  const frontendUrl = configService.get<string>('frontendUrl');
  const corsConfig = createCorsConfig(frontendUrl);
  app.enableCors(corsConfig);

  // Configurare static files
  app.use('/uploads', express.static(paths.uploadsDir));

  const port = configService.get<number>('port');
  const apiUrl = configService.get<string>('apiUrl');

  await app.listen(port);

  console.log({
    environment: configService.get('nodeEnv'),
    serverUrl: apiUrl,
    corsOrigins: frontendUrl,
    uploadsPath: paths.uploadsDir,
    dataPath: paths.dataDir
  });
}

bootstrap();