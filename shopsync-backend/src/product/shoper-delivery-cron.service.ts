import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AuthService } from "../auth/auth.service";
import { ProductService } from "./product.service";
import { ShoperDeliverySettingsService } from "./shoper-delivery-settings.service";

@Injectable()
export class ShoperDeliveryCronService {
  private readonly logger = new Logger(ShoperDeliveryCronService.name);
  private running = false;

  constructor(
    private readonly authService: AuthService,
    private readonly productService: ProductService,
    private readonly settingsService: ShoperDeliverySettingsService,
  ) {}

  @Cron("0 */1 * * * *")
  async handleCron() {
    if (this.running) {
      return;
    }

    const settings = await this.settingsService.getSettings();
    const timeZone = settings.autoRun.timezone || "Europe/Warsaw";
    const today = this.settingsService.getDateInTimeZone(new Date(), timeZone);
    const nowHHmm = this.settingsService.getHHmmInTimeZone(new Date(), timeZone);

    if (!settings.enabled || !settings.autoRun.enabled) {
      return;
    }
    const categoryIds = settings.categoryIds?.length
      ? settings.categoryIds
      : settings.categoryId
        ? [settings.categoryId]
        : [];

    if (!categoryIds.length) {
      this.logger.warn("Pominięto cron czasu wysyłki: brak kategorii.");
      return;
    }

    if (this.toMinutes(nowHHmm) < this.toMinutes(settings.autoRun.runAt)) {
      return;
    }

    const weekdayKey = this.settingsService.getWeekdayKeyInTimeZone(
      new Date(),
      timeZone,
    );
    const deliveryId = Number(settings.schedule[weekdayKey]);

    if (!Number.isFinite(deliveryId) || deliveryId <= 0) {
      this.logger.warn(
        `Pominięto cron czasu wysyłki: brak poprawnego deliveryId dla dnia ${weekdayKey}.`,
      );
      return;
    }

    const runKey = [
      today,
      settings.autoRun.runAt,
      categoryIds.join(","),
      deliveryId,
      settings.includeInactive ? "all" : "active",
      settings.onlyInStock ? "stock" : "all-stock",
    ].join("|");

    if (
      settings.autoRun.lastRunKey === runKey &&
      (settings.autoRun.lastStatus === "completed" ||
        settings.autoRun.lastStatus === "failed")
    ) {
      return;
    }

    this.running = true;
    const runJobId = `multi:${today}:${categoryIds.join(",")}`;
    try {
      const shoperToken = await this.authService.authorizeShoper();
      await this.settingsService.markCronStarted(today, runKey, runJobId);
      this.logger.log(
        `Uruchomiono cron czasu wysyłki. runId=${runJobId}, runKey=${runKey}, categories=${categoryIds.join(",")}, deliveryId=${deliveryId}`,
      );

      const job = await this.productService.bulkUpdateShoperDeliveryTime(
        {
          categoryIds,
          deliveryId,
          includeInactive: settings.includeInactive,
          onlyInStock: settings.onlyInStock,
          limit: 100,
        },
        {
          shoperToken,
          apiloToken: "",
        },
      );

      await this.waitForJob(job.jobId);
      const finished = this.productService.getShoperDeliveryTimeJob(job.jobId);
      const failed = finished.status !== "completed";
      const updatedCount = finished.updatedCount;
      const failedCount = finished.failedCount;

      await this.settingsService.markCronFinished(runJobId, failed ? "failed" : "completed");
      this.logger.log(
        `Zakończono cron czasu wysyłki. runId=${runJobId}, status=${failed ? "failed" : "completed"}, updated=${updatedCount}, failed=${failedCount}`,
      );
    } catch (error) {
      this.logger.error("Błąd crona czasu wysyłki Shoper", error as any);
    } finally {
      this.running = false;
    }
  }

  private async waitForJob(jobId: string) {
    for (let attempt = 0; attempt < 720; attempt += 1) {
      const job = this.productService.getShoperDeliveryTimeJob(jobId);
      if (job.status !== "running") {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(":").map((part) => Number(part));
    return hours * 60 + minutes;
  }
}
