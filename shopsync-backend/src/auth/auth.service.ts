import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtPayload, LoginShoperDto } from "./auth.dto";
import { ConfigService } from "@nestjs/config";
import { Config } from "../config/config";
import { JwtService } from "@nestjs/jwt";
import axios from "axios";
import * as qs from "qs";
import {
  buildAllegroUserAgent,
  withAllegroUserAgent,
} from "../allegro/allegro-user-agent";
import { allegroSandboxHttpsAgent } from "../allegro/allegro-sandbox-https";
import { getShoperRestBaseUrl } from "../config/service-endpoints";
import { ApiloTokenService } from "./apilo-token.service";
const CODE_URL = "https://allegro.pl.allegrosandbox.pl/auth/oauth/device";
const TOKEN_URL = "https://allegro.pl.allegrosandbox.pl/auth/oauth/token";

const CODE_URL_prod = "https://allegro.pl/auth/oauth/device";
const TOKEN_URL_prod = "https://allegro.pl/auth/oauth/token";

@Injectable()
export class AuthService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService<Config, true>,
    private jwtService: JwtService,
    private apiloTokenService: ApiloTokenService,
  ) {}

  private getAllegroUserAgent() {
    return buildAllegroUserAgent({
      appName: this.config.get("allegroAppName", { infer: true }),
      appVersion: this.config.get("allegroAppVersion", { infer: true }),
      appUrl: this.config.get("allegroAppUrl", { infer: true }),
    });
  }

  private getRequiredConfigValue(key: keyof Config, label: string) {
    const value = this.config.get(key, { infer: true });

    if (typeof value !== "string" || !value.trim()) {
      throw new InternalServerErrorException(`Missing ${label} configuration`);
    }

    return value.trim();
  }

  private getShoperRestUrl(path: string) {
    return `${getShoperRestBaseUrl()}${path}`;
  }

  public async authorizeShoper() {
    const shoperPassword = this.getRequiredConfigValue(
      "shoperpassword",
      "SHOPER_PASSWORD",
    );
    const shoperUsername = this.getRequiredConfigValue(
      "shoperUsername",
      "SHOPER_USERNAME",
    );

    const response = await this.httpService.axiosRef.post(
      this.getShoperRestUrl("/auth"),
      {},
      {
        auth: {
          username: shoperUsername,
          password: shoperPassword,
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data["access_token"];
  }

  public async authorizeApilo() {
    return this.apiloTokenService.getAccessToken();
  }

  async loginShoperAndApilo(dto: LoginShoperDto) {
    const appPassword = this.getRequiredConfigValue(
      "appPassword",
      "APP_PASSWORD",
    );
    const appUsername = this.getRequiredConfigValue(
      "appUsername",
      "APP_USERNAME",
    );

    if (dto.login != appUsername) {
      throw new UnauthorizedException("invalid login");
    }
    if (dto.password != appPassword) {
      throw new UnauthorizedException("invalid password");
    }

    const [shoperToken, apiloToken] = await Promise.all([
      this.authorizeShoper(),
      this.authorizeApilo(),
    ]);

    const jwtPayload: JwtPayload = {
      shoperToken: shoperToken,
      apiloToken: apiloToken,
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
    };
  }

  private getBasicAuthHeader() {
    const clientId = this.getRequiredConfigValue(
      "allegroSandboxClientId",
      "ALLEGRO_SANDBOX_CLIENT_ID",
    );
    const clientSecret = this.getRequiredConfigValue(
      "allegroSandboxClientSecret",
      "ALLEGRO_SANDBOX_CLIENT_SECRET",
    );
    const base64 = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    return `Basic ${base64}`;
  }

  async getDeviceCode(): Promise<any> {
    const headers = withAllegroUserAgent(
      {
        Authorization: this.getBasicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      this.getAllegroUserAgent(),
    );
    const data = qs.stringify({
      client_id: this.getRequiredConfigValue(
        "allegroSandboxClientId",
        "ALLEGRO_SANDBOX_CLIENT_ID",
      ),
    });

    const response = await axios.post(CODE_URL, data, {
      headers,
      httpsAgent: allegroSandboxHttpsAgent,
    });
    return response.data;
  }

  async pollAccessToken(deviceCode: string): Promise<any> {
    const headers = withAllegroUserAgent(
      {
        Authorization: this.getBasicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      this.getAllegroUserAgent(),
    );

    const data = qs.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: deviceCode,
    });

    const response = await axios.post(TOKEN_URL, data, {
      headers,
      httpsAgent: allegroSandboxHttpsAgent,
    });
    return response.data;
  }

  private getBasicAuthHeaderProd() {
    const clientId = this.getRequiredConfigValue(
      "allegroProdClientId",
      "ALLEGRO_PROD_CLIENT_ID",
    );
    const clientSecret = this.getRequiredConfigValue(
      "allegroProdClientSecret",
      "ALLEGRO_PROD_CLIENT_SECRET",
    );
    const base64 = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    return `Basic ${base64}`;
  }

  async getDeviceCodeProd(): Promise<any> {
    const headers = withAllegroUserAgent(
      {
        Authorization: this.getBasicAuthHeaderProd(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      this.getAllegroUserAgent(),
    );
    const data = qs.stringify({
      client_id: this.getRequiredConfigValue(
        "allegroProdClientId",
        "ALLEGRO_PROD_CLIENT_ID",
      ),
    });

    const response = await axios.post(CODE_URL_prod, data, { headers });
    return response.data;
  }

  async pollAccessTokenProd(deviceCodeProd: string): Promise<any> {
    const headers = withAllegroUserAgent(
      {
        Authorization: this.getBasicAuthHeaderProd(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      this.getAllegroUserAgent(),
    );

    const data = qs.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: deviceCodeProd,
    });

    const response = await axios.post(TOKEN_URL_prod, data, { headers });
    return response.data;
  }
}
