import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const BASE_ORIGINS = [
  'https://ai-psixolog.uz',
  'https://admin.ai-psixolog.uz',
  'http://localhost:5173',
  'http://localhost:5174',
];
const ALLOWED_ORIGINS = process.env.EXTRA_ORIGINS
  ? [...BASE_ORIGINS, ...process.env.EXTRA_ORIGINS.split(',').map(o => o.trim())]
  : BASE_ORIGINS;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Maktab Psixolog Tizimi backend ishga tushdi: http://localhost:${port}/api`);
}
bootstrap();
