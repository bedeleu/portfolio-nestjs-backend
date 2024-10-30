// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { WorksModule } from './works/works.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV}`,
        '.env'
      ],
    }),
    WorksModule,
    ServeStaticModule.forRoot({
      rootPath: process.env.UPLOAD_DIR || join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ]
})
export class AppModule {}