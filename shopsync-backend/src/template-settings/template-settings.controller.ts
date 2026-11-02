import { BadRequestException, Body, ConflictException, Controller, Get, Headers, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { TemplateSettingsService } from './template-settings.service';

@Controller('template-settings')
@UseGuards(JwtAuthGuard)
export class TemplateSettingsController {
  constructor(private readonly settings: TemplateSettingsService) {}

  @Get()
  getSettings() { return this.settings.getSettings(); }

  @Put(':key')
  async save(@Param('key') key: string, @Headers('if-match') ifMatch: string, @Body() body: unknown) {
    const revision = Number(ifMatch);
    if (!Number.isInteger(revision) || revision < 1) throw new BadRequestException('Invalid If-Match revision.');
    const result = await this.settings.save(key, body, revision);
    if (result.conflict) throw new ConflictException({ message: 'Settings changed on the server.', settings: result.settings });
    return result.settings;
  }
}
