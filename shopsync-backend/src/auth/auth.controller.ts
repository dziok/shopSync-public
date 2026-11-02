import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
  async pollAccessToken_prod(
    @Query("device_code") deviceCodeProd: string,
    @Query("label") label = "",
  ) {
    return this.authService.pollAccessTokenProd(deviceCodeProd, label);
  }

  @UseGuards(JwtAuthGuard)
  @Get("allegro-token-prod")
  async getSavedAllegroAccessToken(@Query("accountId") accountId = "") {
    return {
      access_token: await this.authService.getAllegroProdAccessToken(accountId || undefined),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("allegro-accounts-prod")
  async getAllegroAccounts() {
    return this.authService.getAllegroProdAccounts();
  }

  @UseGuards(JwtAuthGuard)
  @Patch("allegro-accounts-prod/:accountId")
  async renameAllegroAccount(
    @Param("accountId") accountId: string,
    @Body("label") label: string,
  ) {
    return this.authService.renameAllegroProdAccount(accountId, label);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("allegro-accounts-prod/:accountId/default")
  async setDefaultAllegroAccount(@Param("accountId") accountId: string) {
    return this.authService.setDefaultAllegroProdAccount(accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("allegro-accounts-prod/:accountId")
  async deleteAllegroAccount(@Param("accountId") accountId: string) {
    return this.authService.deleteAllegroProdAccount(accountId);
  }
}
