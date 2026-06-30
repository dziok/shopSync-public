// src/order/order.controller.ts
import { Controller, Get, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DecodedAuthTokens } from '../decorators';
import { JwtPayload } from '../auth/auth.dto';
import { ApiloOrderService } from './order.service';
import { ApiloSettingsService, ApiloSettingsFile } from './apilo-settings.service';

@Controller('apilo-orders')
export class ApiloOrderController {
    constructor(
        private readonly apiloOrderService: ApiloOrderService,
        private readonly apiloSettingsService: ApiloSettingsService,
    ) { }

    @Get('status/:statusId')
    @UseGuards(JwtAuthGuard)
    getByStatus(
        @Param('statusId') statusId: string,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
        @Query('limit') limit = '100',
        @Query('offset') offset = '0',
    ) {
        return this.apiloOrderService.getOrdersByStatus(
            Number(statusId),
            decodedTokens,
            Number(limit),
            Number(offset),
        );
    }

    @Get('assign-line1')
    @UseGuards(JwtAuthGuard)
    async assignLine1(@DecodedAuthTokens() decodedTokens: JwtPayload) {
        const settings: ApiloSettingsFile = await this.apiloSettingsService.getSettings();
        if (!settings.line1.active || !this.apiloOrderService.isLineEffectiveActiveNow(settings.line1)) {
            throw new BadRequestException('Linia 1 jest nieaktywna (ręcznie lub poza godzinami harmonogramu).');
        }

        const result = await this.apiloOrderService.assignOrdersForLine(settings.line1, decodedTokens.apiloToken);
        return result;
    }

    @Get('assign-line2')
    @UseGuards(JwtAuthGuard)
    async assignLine2(@DecodedAuthTokens() decodedTokens: JwtPayload) {
        const settings: ApiloSettingsFile = await this.apiloSettingsService.getSettings();

        if (!settings.line2.active || !this.apiloOrderService.isLineEffectiveActiveNow(settings.line2)) {
            throw new BadRequestException('Linia 2 jest nieaktywna (ręcznie lub poza godzinami harmonogramu).');
        }

        const result = await this.apiloOrderService.assignOrdersForLine(settings.line2, decodedTokens.apiloToken);
        return result;
    }
}
