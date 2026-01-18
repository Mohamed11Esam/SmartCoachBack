import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global validation pipe with whitelist to strip unknown properties
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('AI Gym Coach API')
    .setDescription('API documentation for the AI-powered Smart Gym Coaching Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Workouts', 'Workout content endpoints')
    .addTag('Nutrition', 'Nutrition content endpoints')
    .addTag('AI', 'AI-powered features')
    .addTag('Coach Profile', 'Coach profile management')
    .addTag('Progress', 'Progress tracking endpoints')
    .addTag('Chat', 'Real-time messaging')
    .addTag('Payments', 'Stripe payment integration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log(`🚀 Application running on: http://localhost:3000`);
  console.log(`📚 Swagger docs available at: http://localhost:3000/api`);
}
bootstrap();
