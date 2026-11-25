import type { INestApplication } from '@nestjs/common';
import { json } from 'express';

export function configureJsonParsers(app: INestApplication) {
  app.use('/template-settings', json({ limit: '4mb' }));
  // Nest detects the scoped jsonParser by name and would skip its global parser.
  app.use(json());
}
