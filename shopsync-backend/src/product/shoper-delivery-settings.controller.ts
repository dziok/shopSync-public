import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/auth.guard";
import {
  ShoperDeliverySettingsPatch,
  ShoperDeliverySettingsService,
} from "./shoper-delivery-settings.service";

@Controller("shoper-delivery-settings")
@UseGuards(JwtAuthGuard)
export class ShoperDeliverySettingsController {
  constructor(
    private readonly shoperDeliverySettingsService: ShoperDeliverySettingsService,
  ) {}

  @Get()
  getSettings() {
    return this.shoperDeliverySettingsService.getSettings();
  }

  @Patch()
  async patchSettings(
    @Headers("if-match") ifMatch: string,
    @Body() patch: ShoperDeliverySettingsPatch,
  ) {
    const expectedRevision = Number(ifMatch);

    if (!Number.isFinite(expectedRevision)) {
      throw new BadRequestException("Missing/invalid If-Match header.");
    }

    const result = await this.shoperDeliverySettingsService.patchSettings(
      patch,
      expectedRevision,
    );

    if (!result.ok) {
      throw new ConflictException({
        message: "Settings have changed on server. Refresh and try again.",
        currentRevision: result.settings.revision,
        settings: result.settings,
      });
    }

    return { success: true, ...result.settings };
  }
}
