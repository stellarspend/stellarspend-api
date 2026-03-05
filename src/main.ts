import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NotFoundFilter } from './common/filters/not-found.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const adapter = app.getHttpAdapter();
  if (adapter.getType() === 'express') {
    const instance = adapter.getInstance() as import('express').Application;
    instance.set('trust proxy', 1);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(), new NotFoundFilter());

  const config = new DocumentBuilder()
    .setTitle('StellarSpend API')
    .setDescription('Backend API for user management, data storage, and Stellar transaction processing')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);


  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
