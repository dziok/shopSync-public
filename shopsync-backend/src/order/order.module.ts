// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { ApiloOrderController } from './order.controller';
import { ApiloOrderService } from './order.service';
import { ApiloOrderCronService } from './order-cron.service';
import { ApiloSettingsController } from './apilo-settings.controller';
import { ApiloSettingsService } from './apilo-settings.service';
import { ApiloSettingsScheduleCronService } from "./apilo-settings-schedule-cron.service";


@Module({
    imports: [HttpModule, AuthModule],
    controllers: [ApiloOrderController, ApiloSettingsController],
    providers: [ApiloOrderService, ApiloOrderCronService, ApiloSettingsService, ApiloSettingsScheduleCronService],
})
export class ApiloOrderModule { }
