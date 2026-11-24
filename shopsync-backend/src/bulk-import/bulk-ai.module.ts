import { Module } from '@nestjs/common';
import { BulkAiController } from './bulk-ai.controller';
import { BulkAiService } from './bulk-ai.service';

@Module({ controllers: [BulkAiController], providers: [BulkAiService] })
export class BulkAiModule {}
