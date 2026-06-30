import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ApiloSettingsService } from "./apilo-settings.service";

@Injectable()
export class ApiloSettingsScheduleCronService {
    private readonly logger = new Logger(ApiloSettingsScheduleCronService.name);

    constructor(private readonly apiloSettingsService: ApiloSettingsService) { }

    // co minutę, zawsze (nie zależy od tokena Apilo)
    @Cron("0 */1 * * * *")
    async tick() {
        try {
            const res = await this.apiloSettingsService.applyAutoScheduleTick();
            if (res.changed) {
                this.logger.log(
                    `AutoSchedule: zapisano przełączenie aktywności. revision=${res.settings.revision}`
                );
            }
        } catch (e) {
            this.logger.error("AutoSchedule: błąd tick()", e as any);
        }
    }
}