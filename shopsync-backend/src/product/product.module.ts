import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { ShoperDeliverySettingsController } from './shoper-delivery-settings.controller';
import { ShoperDeliverySettingsService } from './shoper-delivery-settings.service';
import { ShoperDeliveryCronService } from './shoper-delivery-cron.service';
import { RelatedProductsController } from './related-products.controller';
import { RelatedProductsService } from './related-products.service';
import { RelatedProductsCronService } from './related-products-cron.service';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ProductController, ShoperDeliverySettingsController, RelatedProductsController],
  providers: [ProductService, ShoperDeliverySettingsService, ShoperDeliveryCronService, RelatedProductsService, RelatedProductsCronService],
})
export class ProductModule { }
