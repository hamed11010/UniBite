import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { getFrontendOrigins } from './common/config/frontend-origin';
import { assertRequiredEnv } from './common/config/required-env';

async function bootstrap() {
  assertRequiredEnv('FRONTEND_URL');

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: getFrontendOrigins(),
    credentials: true,
  });


  // Enable cookie parser
  app.use(cookieParser());

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
void bootstrap();
