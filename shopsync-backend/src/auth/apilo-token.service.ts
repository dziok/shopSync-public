import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import axios from "axios";
import { chmod, mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { Config } from "../config/config";
import { ConnectApiloDto } from "./auth.dto";

const DEFAULT_MIN_VALIDITY_MS = 60 * 60 * 1000;
const MAINTENANCE_MIN_VALIDITY_MS = 24 * 60 * 60 * 1000;

interface ApiloTokenState {
  accessToken: string;
  accessTokenExpireAt: string;
  refreshToken: string;
  refreshTokenExpireAt: string;
  updatedAt?: string;
  clientId?: string;
  clientSecret?: string;
}

interface ApiloTokenResponse {
  accessToken: string;
  accessTokenExpireAt: string;
  refreshToken: string;
  refreshTokenExpireAt: string;
}

export interface ApiloTokenStatus {
  status: "valid" | "expiring" | "expired" | "not_initialized";
  accessTokenExpireAt: string | null;
  refreshTokenExpireAt: string | null;
  automaticRefresh: boolean;
  lastRefreshedAt: string | null;
  credentialsConfigured: boolean;
}

@Injectable()
export class ApiloTokenService {
  private readonly logger = new Logger(ApiloTokenService.name);
  private tokenState?: ApiloTokenState;
  private stateLoaded = false;
  private pendingTokenRequest?: Promise<string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<Config, true>,
  ) {}

  async getAccessToken(
    minValidityMs = DEFAULT_MIN_VALIDITY_MS,
  ): Promise<string> {
    if (!this.pendingTokenRequest) {
      const tracked = this.resolveAccessToken(minValidityMs).finally(() => {
        if (this.pendingTokenRequest === tracked) {
          this.pendingTokenRequest = undefined;
        }
      });
      this.pendingTokenRequest = tracked;
    }

    return this.pendingTokenRequest;
  }

  async connect(dto: ConnectApiloDto): Promise<string> {
    const authorizationCode = dto.authorizationCode?.trim();
    const clientId = dto.clientId?.trim();
    const clientSecret = dto.clientSecret?.trim();
    if (!authorizationCode) {
      throw new BadRequestException("Podaj kod autoryzacyjny Apilo.");
    }
    if (Boolean(clientId) !== Boolean(clientSecret)) {
      throw new BadRequestException("Podaj zarówno ID klienta, jak i sekret klienta.");
    }

    return this.runExclusiveTokenRequest(async () => {
      await this.loadTokenState();
      return this.exchangeToken("authorization_code", authorizationCode, clientId && clientSecret
        ? { clientId, clientSecret }
        : undefined);
    });
  }

  async refreshAccessToken(): Promise<string> {
    return this.runExclusiveTokenRequest(async () => {
      await this.loadTokenState();
      if (!this.tokenState?.refreshToken || !this.isValidUntil(this.tokenState.refreshTokenExpireAt, 0)) {
        throw new BadRequestException("Brak ważnego tokenu odświeżającego. Połącz Apilo nowym kodem autoryzacyjnym.");
      }
      return this.exchangeToken("refresh_token", this.tokenState.refreshToken);
    });
  }

  private async runExclusiveTokenRequest(action: () => Promise<string>): Promise<string> {
    const previous = this.pendingTokenRequest;
    const request = (async () => {
      if (previous) {
        await previous.catch(() => undefined);
      }
      return action();
    })();
    const tracked = request.finally(() => {
      if (this.pendingTokenRequest === tracked) {
        this.pendingTokenRequest = undefined;
      }
    });
    this.pendingTokenRequest = tracked;
    return tracked;
  }

  async getStatus(): Promise<ApiloTokenStatus> {
    await this.loadTokenState();

    if (this.tokenState) {
      return {
        ...this.buildStatus(
        this.tokenState.accessTokenExpireAt,
        this.tokenState.refreshTokenExpireAt,
        this.tokenState.updatedAt,
        ),
        credentialsConfigured: Boolean(this.tokenState.clientId && this.tokenState.clientSecret)
          || this.hasConfiguredCredentials(),
      };
    }

    const configuredAccessToken =
      this.getOptionalConfigValue("apiloAccessToken");
    const configuredAccessTokenExpiry = configuredAccessToken
      ? this.getJwtExpiry(configuredAccessToken)
      : undefined;

    if (configuredAccessTokenExpiry) {
      return {
        status: this.getExpiryStatus(configuredAccessTokenExpiry),
        accessTokenExpireAt: new Date(
          configuredAccessTokenExpiry,
        ).toISOString(),
        refreshTokenExpireAt: null,
        automaticRefresh: false,
        lastRefreshedAt: null,
        credentialsConfigured: this.hasConfiguredCredentials(),
      };
    }

    return {
      status: "not_initialized",
      accessTokenExpireAt: null,
      refreshTokenExpireAt: null,
      automaticRefresh: false,
      lastRefreshedAt: null,
      credentialsConfigured: this.hasConfiguredCredentials(),
    };
  }

  @Cron("0 0 */6 * * *")
  async maintainToken(): Promise<void> {
    try {
      await this.getAccessToken(MAINTENANCE_MIN_VALIDITY_MS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Apilo token error";
      this.logger.error(`Automatic Apilo token refresh failed: ${message}`);
    }
  }

  private async resolveAccessToken(minValidityMs: number): Promise<string> {
    await this.loadTokenState();

    if (
      this.tokenState &&
      this.isValidUntil(this.tokenState.accessTokenExpireAt, minValidityMs)
    ) {
      return this.tokenState.accessToken;
    }

    if (
      this.tokenState?.refreshToken &&
      this.isValidUntil(this.tokenState.refreshTokenExpireAt, 0)
    ) {
      try {
        return await this.exchangeToken("refresh_token", this.tokenState.refreshToken);
      } catch (error) {
        const authorizationCode = this.getOptionalConfigValue("apiloAuthorizationCode");
        if (!authorizationCode || !(error instanceof BadRequestException)) {
          throw error;
        }
        this.logger.warn("Saved Apilo refresh token was rejected; trying configured authorization code.");
        return this.exchangeToken("authorization_code", authorizationCode, this.getEnvironmentCredentials());
      }
    }

    const authorizationCode = this.getOptionalConfigValue(
      "apiloAuthorizationCode",
    );
    if (authorizationCode) {
      return this.exchangeToken("authorization_code", authorizationCode, this.getEnvironmentCredentials());
    }

    const configuredAccessToken =
      this.getOptionalConfigValue("apiloAccessToken");
    const configuredAccessTokenExpiry = configuredAccessToken
      ? this.getJwtExpiry(configuredAccessToken)
      : undefined;

    if (
      configuredAccessToken &&
      configuredAccessTokenExpiry &&
      configuredAccessTokenExpiry > Date.now() + minValidityMs
    ) {
      this.logger.warn(
        "Using APILO_ACCESS_TOKEN without refresh support. Configure APILO_AUTHORIZATION_CODE to initialize automatic refresh.",
      );
      return configuredAccessToken;
    }

    throw new InternalServerErrorException(
      "Apilo authorization is not initialized. Set APILO_CLIENT_ID, APILO_CLIENT_SECRET and a new APILO_AUTHORIZATION_CODE.",
    );
  }

  private async exchangeToken(
    grantType: "authorization_code" | "refresh_token",
    token: string,
    credentials?: { clientId: string; clientSecret: string },
  ): Promise<string> {
    const activeCredentials = credentials ?? this.getSavedOrEnvironmentCredentials();
    const authUrl = this.getAuthUrl();

    let responseData: ApiloTokenResponse;

    try {
      const response = await this.httpService.axiosRef.post<ApiloTokenResponse>(
        authUrl,
        {
          grantType,
          token,
        },
        {
          auth: {
            username: activeCredentials.clientId,
            password: activeCredentials.clientSecret,
          },
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );
      responseData = response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          throw new BadRequestException(grantType === "authorization_code"
            ? `Apilo odrzuciło dane autoryzacyjne (HTTP ${status}). Sprawdź ID klienta, sekret i ważność kodu.`
            : `Apilo odrzuciło token odświeżający (HTTP ${status}). Połącz konto nowym kodem autoryzacyjnym.`);
        }
        throw new InternalServerErrorException(`Żądanie tokenu Apilo nie powiodło się${status ? ` (HTTP ${status})` : ""}.`);
      }
      throw error;
    }

    this.assertTokenResponse(responseData);
    const nextTokenState: ApiloTokenState = {
      ...responseData,
      updatedAt: new Date().toISOString(),
      ...(credentials ? credentials : this.tokenState?.clientId && this.tokenState?.clientSecret
        ? { clientId: this.tokenState.clientId, clientSecret: this.tokenState.clientSecret }
        : {}),
    };
    await this.saveTokenState(nextTokenState);
    this.tokenState = nextTokenState;

    return responseData.accessToken;
  }

  private async loadTokenState(): Promise<void> {
    if (this.stateLoaded) {
      return;
    }
    this.stateLoaded = true;

    try {
      const rawState = await readFile(this.getTokenFilePath(), "utf8");
      const parsedState = JSON.parse(rawState) as ApiloTokenState;
      this.assertTokenResponse(parsedState);
      this.tokenState = parsedState;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw new InternalServerErrorException(
        `Cannot read Apilo token state from ${this.getTokenFilePath()}.`,
      );
    }
  }

  private async saveTokenState(state: ApiloTokenState): Promise<void> {
    const tokenFilePath = this.getTokenFilePath();
    const tokenDirectory = dirname(tokenFilePath);
    const temporaryPath = `${tokenFilePath}.${process.pid}.tmp`;

    await mkdir(tokenDirectory, { recursive: true, mode: 0o700 });
    await writeFile(temporaryPath, JSON.stringify(state, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, tokenFilePath);
    await chmod(tokenFilePath, 0o600);
  }

  private getTokenFilePath(): string {
    const configuredPath = this.getOptionalConfigValue("apiloTokenFile");
    return configuredPath
      ? resolve(configuredPath)
      : resolve(__dirname, "..", "..", ".data", "apilo-tokens.json");
  }

  private getAuthUrl(): string {
    const configuredAuthUrl = this.getOptionalConfigValue("apiloAuthUrl");
    if (configuredAuthUrl) {
      return configuredAuthUrl;
    }

    const apiBaseUrl = this.getRequiredConfigValue(
      "apiloBaseUrl",
      "APILO_BASE_URL",
    );

    try {
      return new URL("/rest/auth/token/", apiBaseUrl).toString();
    } catch {
      throw new InternalServerErrorException(
        "APILO_BASE_URL must be a valid URL.",
      );
    }
  }

  private isValidUntil(expireAt: string, minValidityMs: number): boolean {
    const expiry = Date.parse(expireAt);
    return Number.isFinite(expiry) && expiry > Date.now() + minValidityMs;
  }

  private buildStatus(
    accessTokenExpireAt: string,
    refreshTokenExpireAt: string,
    lastRefreshedAt?: string,
  ): Omit<ApiloTokenStatus, "credentialsConfigured"> {
    const accessExpiry = Date.parse(accessTokenExpireAt);
    const refreshExpiry = Date.parse(refreshTokenExpireAt);

    return {
      status: Number.isFinite(accessExpiry)
        ? this.getExpiryStatus(accessExpiry)
        : "expired",
      accessTokenExpireAt,
      refreshTokenExpireAt,
      automaticRefresh:
        Number.isFinite(refreshExpiry) && refreshExpiry > Date.now(),
      lastRefreshedAt: lastRefreshedAt ?? null,
    };
  }

  private getExpiryStatus(expiry: number): "valid" | "expiring" | "expired" {
    if (expiry <= Date.now()) {
      return "expired";
    }
    if (expiry <= Date.now() + MAINTENANCE_MIN_VALIDITY_MS) {
      return "expiring";
    }
    return "valid";
  }

  private getJwtExpiry(token: string): number | undefined {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
      ) as { exp?: number };
      return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
    } catch {
      return undefined;
    }
  }

  private assertTokenResponse(
    response: ApiloTokenResponse,
  ): asserts response is ApiloTokenState {
    const requiredFields: Array<keyof ApiloTokenResponse> = [
      "accessToken",
      "accessTokenExpireAt",
      "refreshToken",
      "refreshTokenExpireAt",
    ];

    if (
      !response ||
      requiredFields.some(
        (field) =>
          typeof response[field] !== "string" || !response[field].trim(),
      )
    ) {
      throw new InternalServerErrorException(
        "Apilo returned an invalid token response.",
      );
    }
  }

  private getOptionalConfigValue(key: keyof Config): string | undefined {
    const value = this.config.get(key, { infer: true });
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private hasConfiguredCredentials(): boolean {
    return Boolean(this.getOptionalConfigValue("apiloClientId") && this.getOptionalConfigValue("apiloClientSecret"));
  }

  private getEnvironmentCredentials(): { clientId: string; clientSecret: string } {
    return {
      clientId: this.getRequiredConfigValue("apiloClientId", "APILO_CLIENT_ID"),
      clientSecret: this.getRequiredConfigValue("apiloClientSecret", "APILO_CLIENT_SECRET"),
    };
  }

  private getSavedOrEnvironmentCredentials(): { clientId: string; clientSecret: string } {
    return this.tokenState?.clientId && this.tokenState?.clientSecret
      ? { clientId: this.tokenState.clientId, clientSecret: this.tokenState.clientSecret }
      : this.getEnvironmentCredentials();
  }

  private getRequiredConfigValue(key: keyof Config, label: string): string {
    const value = this.getOptionalConfigValue(key);
    if (!value) {
      throw new InternalServerErrorException(`Missing ${label} configuration`);
    }
    return value;
  }
}
