import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginShoperDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @Post('login/shoper')
  loginShoper(@Body() dto: LoginShoperDto) {
    return this.authService.loginShoperAndApilo(dto);
  }

  @Get('device-code')
  async getDeviceCode() {
    return this.authService.getDeviceCode();
  }

  @Get('poll-token')
  async pollAccessToken(@Query('device_code') deviceCode: string) {
    return this.authService.pollAccessToken(deviceCode);
  }

  @Get('device-code-prod')
  async getDeviceCodeProd() {
    return this.authService.getDeviceCodeProd();
  }

  @Get('poll-token-prod')
  async pollAccessToken_prod(@Query('device_code') deviceCodeProd: string) {
    return this.authService.pollAccessTokenProd(deviceCodeProd);
  }
}
