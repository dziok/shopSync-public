import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CloudinaryController } from './cloudinary-controller';
import { CloudinaryService } from './cloudinary-service';

@Module({
    imports: [ConfigModule.forRoot(), HttpModule], // ← WAŻNE!
    controllers: [CloudinaryController],
    providers: [CloudinaryService],
})
export class CloudinaryModule { }
