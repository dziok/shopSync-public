import { Body, Controller, INestApplication, Post, Put, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { LoginShoperDto } from './auth/auth.dto';
import { configureJsonParsers } from './json-parsers';

@Controller()
class ParserProbe {
  @Post('auth/login/shoper')
  login(@Body() body: LoginShoperDto) { return { login: body.login }; }

  @Put('template-settings/pc')
  settings(@Body() body: { text: string }) { return { size: body.text.length }; }
}

describe('JSON request parsing', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [ParserProbe] }).compile();
    app = module.createNestApplication();
    configureJsonParsers(app);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });
  afterAll(() => app.close());

  it('delivers credentials to the login DTO', () =>
    request(app.getHttpServer()).post('/auth/login/shoper').send({ login: 'operator', password: 'test-only' })
      .expect(201, { login: 'operator' }));

  it('only accepts larger documents on the settings route', async () => {
    const text = 'x'.repeat(110 * 1024);
    await request(app.getHttpServer()).put('/template-settings/pc').send({ text }).expect(200, { size: text.length });
    await request(app.getHttpServer()).post('/auth/login/shoper').send({ text }).expect(413);
  });
});
