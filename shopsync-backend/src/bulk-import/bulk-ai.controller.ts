import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { BulkAiService } from './bulk-ai.service';

@Controller('bulk-ai')
@UseGuards(JwtAuthGuard)
export class BulkAiController {
    constructor(private readonly service: BulkAiService) {}

    @Get('settings')
    getSettings() { return this.service.getPublicSettings(); }

    @Get('models')
    listModels() { return this.service.listModels(); }

    @Put('settings')
    updateSettings(@Body() body: Record<string, unknown>) { return this.service.updateSettings(body); }

    @Post('test')
    testConnection() { return this.service.testConnection(); }

    @Post('analyze')
    analyze(@Body() row: Record<string, unknown>) { return this.service.analyze(row); }

    @Post('form')
    form(@Body() body: Record<string, unknown>) { return this.service.suggestForm(body); }

    @Post('suitability')
    suitability(@Body() body: Record<string, unknown>) { return this.service.suitability(body); }
}
