import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AuthService } from "../auth/auth.service";
import { RelatedProductsService } from "./related-products.service";

@Injectable()
export class RelatedProductsCronService {
  private readonly logger = new Logger(RelatedProductsCronService.name);
  private running = false;

  constructor(
    private readonly authService: AuthService,
    private readonly relatedProductsService: RelatedProductsService,
  ) {}

  @Cron("0 */5 * * * *")
  async handleCron() {
    if (this.running) {
      return;
    }

    const state = await this.relatedProductsService.getState();
    const timeZone = state.autoRun.timezone || "Europe/Warsaw";
    const today = this.relatedProductsService.getDateInTimeZone(
      new Date(),
      timeZone,
    );
    const nowHHmm = this.relatedProductsService.getHHmmInTimeZone(
      new Date(),
      timeZone,
    );

    if (!state.autoRun.enabled) {
      return;
    }

    if (this.toMinutes(nowHHmm) < this.toMinutes(state.autoRun.runAt)) {
      return;
    }

    const runKey = [today, state.autoRun.runAt].join("|");

    if (
      state.autoRun.lastRunDate === today &&
      state.autoRun.lastRunKey === runKey &&
      (state.autoRun.lastStatus === "completed" ||
        state.autoRun.lastStatus === "failed")
    ) {
      return;
    }

    if (!state.dueAssignmentsCount) {
      await this.relatedProductsService.markCronStarted(today, runKey);
      await this.relatedProductsService.markCronFinished("completed", 0, 0);
      return;
    }

    this.running = true;
    try {
      await this.relatedProductsService.markCronStarted(today, runKey);
      const shoperToken = await this.authService.authorizeShoper();
      const result = await this.relatedProductsService.syncDueAssignments({
        shoperToken,
        apiloToken: "",
      });
      const failed = result.failed.length > 0;

      await this.relatedProductsService.markCronFinished(
        failed ? "failed" : "completed",
        result.updated.length,
        result.failed.length,
      );
      this.logger.log(
        `Zakończono cron produktów powiązanych. updated=${result.updated.length}, failed=${result.failed.length}`,
      );
    } catch (error) {
      await this.relatedProductsService.markCronFinished("failed", 0, 1);
      this.logger.error("Błąd crona produktów powiązanych", error as any);
    } finally {
      this.running = false;
    }
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(":").map((part) => Number(part));
    return hours * 60 + minutes;
  }
}
