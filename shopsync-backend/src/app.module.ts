import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { getConfig } from './config/config';
import { ProductModule } from './product/product.module';
import { ProductImageModule } from './product-image/product-image.module';
import { CategoriesModule } from './categories/categories.module';
import { CloudinaryController } from './img-host/cloudinary-controller';
import { CloudinaryModule } from './img-host/cloudinary-module';
import { AttributeGroupsModule } from './attributes/attributes.module';
import { TranslateModule } from './translate/translate.module';
import { ApiloOrderModule } from './order/order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { resolve } from 'path';
import { TemplateSettingsModule } from './template-settings/template-settings.module';
import { ChatGptFeedModule } from './chatgpt-feed/chatgpt-feed.module';


const appRoot = resolve(__dirname, '..');

@Module({
  imports: [ConfigModule.forRoot({
    load: [getConfig],
    envFilePath: [
      `${appRoot}/${process.env.NODE_ENV}.env.local`,
      `${appRoot}/production.env.local`,
      `${appRoot}/.env.local`,
      `${appRoot}/${process.env.NODE_ENV}.env`,
      `${appRoot}/production.env`,
      `${appRoot}/.env`,
    ],
    isGlobal: true
  }), ScheduleModule.forRoot(), AuthModule, ProductModule, ProductImageModule, CategoriesModule, CloudinaryModule, AttributeGroupsModule, TranslateModule, ApiloOrderModule, TemplateSettingsModule, ChatGptFeedModule],
})
export class AppModule { }
