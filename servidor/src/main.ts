import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  getApplicationConfig,
  getDatabaseConfig,
} from './config/application.config';
import { ensureDatabaseExists } from './config/ensure-database';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const { port, clientUrl } = getApplicationConfig();
  const database = getDatabaseConfig();

  await ensureDatabaseExists(database);

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: clientUrl,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  Logger.log(
    `Servidor en port=${port} clientUrl=${clientUrl} db=${database.host}:${database.port}/${database.database}`,
    'Bootstrap',
  );
}
void bootstrap();
