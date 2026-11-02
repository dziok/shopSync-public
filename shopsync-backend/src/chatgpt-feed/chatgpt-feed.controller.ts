import { Controller, Get, Header, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ChatGptFeedService } from './chatgpt-feed.service';

@Controller('chatgpt-feed')
@UseGuards(JwtAuthGuard)
export class ChatGptFeedController {
  constructor(private readonly feed: ChatGptFeedService) {}

  @Get('status')
  status() { return this.feed.status(); }

  @Post('refresh')
  refresh() { return this.feed.refresh(); }

  @Get('download')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="chatgpt-ads-feed.csv"')
  async download(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(await this.feed.download());
  }
}
