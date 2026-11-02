import { Module } from '@nestjs/common';
import { ChatGptFeedController } from './chatgpt-feed.controller';
import { ChatGptFeedService } from './chatgpt-feed.service';
import { CloudinaryModule } from '../img-host/cloudinary-module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [CloudinaryModule, AuthModule], controllers: [ChatGptFeedController], providers: [ChatGptFeedService] })
export class ChatGptFeedModule {}
