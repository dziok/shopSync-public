import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/config';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serwowanie statycznych plików (np. zdjęć)
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const config = app.get(ConfigService<Config>);
  const host = config.get('host');
  const port = config.get('port');

  await app.listen(port, host);
}

bootstrap();
