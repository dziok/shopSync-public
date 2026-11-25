import { Module } from '@nestjs/common';
import { BulkAiController } from './bulk-ai.controller';
import { BulkAiService } from './bulk-ai.service';

import { TemplateSettingsModule } from '../template-settings/template-settings.module';
@Module({ imports: [TemplateSettingsModule], controllers: [BulkAiController], providers: [BulkAiService] })
export class BulkAiModule {}
