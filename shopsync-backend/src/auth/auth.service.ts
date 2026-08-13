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
import { chmod, mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
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

interface AllegroProdTokenState {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  updatedAt: string;
}

interface AllegroProdTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

@Injectable()
export class AuthService {
  private allegroProdTokenState?: AllegroProdTokenState;
  private allegroProdTokenStateLoaded = false;
  private pendingAllegroProdToken?: Promise<string>;

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

    const response = await axios.post<AllegroProdTokenResponse>(
      TOKEN_URL_prod,
      data,
      { headers },
    );
    const accessToken = await this.saveAllegroProdTokenResponse(response.data);
    return {
      access_token: accessToken,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
    };
  }

  async getAllegroProdAccessToken(): Promise<string> {
    if (!this.pendingAllegroProdToken) {
      this.pendingAllegroProdToken = this.resolveAllegroProdAccessToken().finally(
        () => {
          this.pendingAllegroProdToken = undefined;
        },
      );
    }
    return this.pendingAllegroProdToken;
  }

  private async resolveAllegroProdAccessToken(): Promise<string> {
    await this.loadAllegroProdTokenState();
    if (
      this.allegroProdTokenState
      && Date.parse(this.allegroProdTokenState.accessTokenExpiresAt) > Date.now() + 60_000
    ) {
      return this.allegroProdTokenState.accessToken;
    }

    if (!this.allegroProdTokenState?.refreshToken) {
      throw new UnauthorizedException("Allegro authorization is required");
    }

    const headers = withAllegroUserAgent(
      {
        Authorization: this.getBasicAuthHeaderProd(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      this.getAllegroUserAgent(),
    );
    const data = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: this.allegroProdTokenState.refreshToken,
    });
    const response = await axios.post<AllegroProdTokenResponse>(
      TOKEN_URL_prod,
      data,
      { headers },
    );
    return this.saveAllegroProdTokenResponse(
      response.data,
      this.allegroProdTokenState.refreshToken,
    );
  }

  private async saveAllegroProdTokenResponse(
    response: AllegroProdTokenResponse,
    fallbackRefreshToken = "",
  ): Promise<string> {
    const accessToken = String(response.access_token ?? "").trim();
    const refreshToken = String(response.refresh_token ?? fallbackRefreshToken).trim();
    if (!accessToken || !refreshToken) {
      throw new InternalServerErrorException(
        "Allegro token response does not contain required tokens",
      );
    }

    const jwtExpiresAt = this.getJwtExpiration(accessToken);
    const expiresIn = Number(response.expires_in);
    const accessTokenExpiresAt = jwtExpiresAt
      ?? (Number.isFinite(expiresIn) && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : undefined);
    if (!accessTokenExpiresAt) {
      throw new InternalServerErrorException(
        "Cannot determine Allegro access token expiration",
      );
    }

    const state: AllegroProdTokenState = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      updatedAt: new Date().toISOString(),
    };
    this.allegroProdTokenState = state;
    this.allegroProdTokenStateLoaded = true;
    await this.saveAllegroProdTokenState(state);
    return accessToken;
  }

  private async loadAllegroProdTokenState(): Promise<void> {
    if (this.allegroProdTokenStateLoaded) return;
    this.allegroProdTokenStateLoaded = true;
    try {
      const rawState = await readFile(this.getAllegroTokenFilePath(), "utf8");
      const state = JSON.parse(rawState) as AllegroProdTokenState;
      if (
        typeof state.accessToken !== "string"
        || typeof state.accessTokenExpiresAt !== "string"
        || typeof state.refreshToken !== "string"
      ) {
        throw new Error("Invalid Allegro token state");
      }
      this.allegroProdTokenState = state;
    } catch (error) {
      if (
        error
        && typeof error === "object"
        && "code" in error
        && error.code === "ENOENT"
      ) {
        return;
      }
      throw new InternalServerErrorException("Cannot read Allegro token state");
    }
  }

  private async saveAllegroProdTokenState(
    state: AllegroProdTokenState,
  ): Promise<void> {
    const tokenFilePath = this.getAllegroTokenFilePath();
    const temporaryPath = `${tokenFilePath}.${process.pid}.tmp`;
    await mkdir(dirname(tokenFilePath), { recursive: true, mode: 0o700 });
    await writeFile(temporaryPath, JSON.stringify(state, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, tokenFilePath);
    await chmod(tokenFilePath, 0o600);
  }

  private getAllegroTokenFilePath(): string {
    const configuredPath = this.config.get("allegroTokenFile", { infer: true });
    return configuredPath?.trim()
      ? resolve(configuredPath.trim())
      : resolve(__dirname, "..", "..", ".data", "allegro-tokens.json");
  }

  private getJwtExpiration(token: string): string | undefined {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
      ) as { exp?: number };
      return typeof payload.exp === "number"
        ? new Date(payload.exp * 1000).toISOString()
        : undefined;
    } catch {
      return undefined;
    }
  }
}
