import { Body, Controller, Post, Get, Query, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginShoperDto } from "./auth.dto";
import { ApiloTokenService } from "./apilo-token.service";
import { JwtAuthGuard } from "./auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiloTokenService: ApiloTokenService,
  ) {}

  @Post("login/shoper")
  loginShoper(@Body() dto: LoginShoperDto) {
    return this.authService.loginShoperAndApilo(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("apilo-token/status")
  getApiloTokenStatus() {
    return this.apiloTokenService.getStatus();
  }

  @Get("device-code")
  async getDeviceCode() {
    return this.authService.getDeviceCode();
  }

  @Get("poll-token")
  async pollAccessToken(@Query("device_code") deviceCode: string) {
    return this.authService.pollAccessToken(deviceCode);
  }

  @Get("device-code-prod")
  async getDeviceCodeProd() {
    return this.authService.getDeviceCodeProd();
  }

  @Get("poll-token-prod")
  async pollAccessToken_prod(@Query("device_code") deviceCodeProd: string) {
    return this.authService.pollAccessTokenProd(deviceCodeProd);
  }

  @UseGuards(JwtAuthGuard)
  @Get("allegro-token-prod")
  async getSavedAllegroAccessToken() {
    return {
      access_token: await this.authService.getAllegroProdAccessToken(),
    };
  }
}
