// src/order/order-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApiloOrderService } from './order.service';
import { AuthService } from '../auth/auth.service';
import { ApiloSettingsService, ApiloSettingsFile } from './apilo-settings.service';

@Injectable()
export class ApiloOrderCronService {
    private readonly logger = new Logger(ApiloOrderCronService.name);

    constructor(
        private readonly apiloOrderService: ApiloOrderService,
        private readonly authService: AuthService,
        private readonly apiloSettingsService: ApiloSettingsService,
    ) { }

    @Cron('0 */1 * * * *')
    async handleCron() {
        try {
            const apiloToken = await this.authService.authorizeApilo();
            if (!apiloToken) {
                this.logger.error('Nie udało się pobrać tokena Apilo');
                return;
            }

            const settings: ApiloSettingsFile = await this.apiloSettingsService.getSettings();
            // Log start z informacją o zakładkach docelowych dla obu linii
            this.logger.log(
                `Start auto-assign Apilo orders (cron)... line1Targets=${settings.line1.targetStatusIds.join(',')}, line2Targets=${settings.line2.targetStatusIds.join(',')}`
            );

            // Uruchom przydział dla każdej aktywnej linii
            if (settings.line1.active && this.apiloOrderService.isLineEffectiveActiveNow(settings.line1)) {
                const result1 = await this.apiloOrderService.assignOrdersForLine(settings.line1, apiloToken);
                this.logger.log(`Przypisano zamówień (linia 1): ${result1.assignedCount}`);
            } else {
                this.logger.log('Linia 1 nieaktywna (ręcznie lub harmonogram) – pomijam.');
            }

            if (settings.line2.active && this.apiloOrderService.isLineEffectiveActiveNow(settings.line2)) {
                const result2 = await this.apiloOrderService.assignOrdersForLine(settings.line2, apiloToken);
                this.logger.log(`Przypisano zamówień (linia 2): ${result2.assignedCount}`);
            } else {
                this.logger.log('Linia 2 nieaktywna (ręcznie lub harmonogram) – pomijam.');
            }

        } catch (e) {
            this.logger.error('Błąd w cronie Apilo', e);
        }
    }
}
