import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security middleware
  app.use(helmet());
  app.use(compression());

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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on port ${port}`);
  console.log(`📚 Swagger docs available at /api`);
}
bootstrap();
