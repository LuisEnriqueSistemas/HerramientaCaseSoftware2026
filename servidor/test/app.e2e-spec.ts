import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/register (POST) rechaza un payload inválido con 400', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'A' })
      .expect(400);
  });

  it('/auth/register (POST) registra un usuario válido con 201', () => {
    const email = `e2e_${Date.now()}@test.com`;
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Usuario E2E', email, password: 'Password123' })
      .expect(201);
  });
});
