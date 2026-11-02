import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { randomUUID } from "crypto";
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
  id?: string;
  label?: string;
  userName?: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  updatedAt: string;
}

interface AllegroProdAccountsState {
  activeAccountId?: string;
  accounts: Required<AllegroProdTokenState>[];
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
  private allegroProdAccountsState?: AllegroProdAccountsState;
  private allegroProdAccountsStateLoaded = false;
  private pendingAllegroProdAccountsLoad?: Promise<void>;
  private allegroProdAccountsWrite = Promise.resolve();
  private pendingAllegroProdTokens = new Map<string, Promise<string>>();

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

  async pollAccessTokenProd(deviceCodeProd: string, label = ""): Promise<any> {
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
    const account = await this.saveAllegroProdTokenResponse(response.data, "", label);
    return {
      account_id: account.id,
      label: account.label,
      access_token: account.accessToken,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
    };
  }

  async getAllegroProdAccounts() {
    await this.loadAllegroProdAccountsState();
    const accounts = await Promise.all(
      (this.allegroProdAccountsState?.accounts ?? []).map(async (account) => {
        try {
          return {
            id: account.id,
            label: account.label,
            userName: account.userName,
            access_token: await this.getAllegroProdAccessToken(account.id),
            status: "connected" as const,
            updatedAt: account.updatedAt,
          };
        } catch (error) {
          const allegroError = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
          return {
            id: account.id,
            label: account.label,
            userName: account.userName,
            access_token: "",
            status: allegroError === "invalid_grant" || error instanceof UnauthorizedException
              ? "login_required" as const
              : "retry" as const,
            updatedAt: account.updatedAt,
          };
        }
      }),
    );

    return {
      activeAccountId: this.allegroProdAccountsState?.activeAccountId ?? accounts[0]?.id ?? "",
      accounts,
    };
  }

  async renameAllegroProdAccount(accountId: string, label: string) {
    await this.loadAllegroProdAccountsState();
    const trimmedLabel = label.trim();

    if (!trimmedLabel) {
      throw new UnauthorizedException("Account label is required");
    }

    const state = this.requireAllegroProdAccountsState();
    const account = state.accounts.find((item) => item.id === accountId);
    if (!account) {
      throw new UnauthorizedException("Allegro account not found");
    }

    account.label = trimmedLabel;
    account.updatedAt = new Date().toISOString();
    state.updatedAt = account.updatedAt;
    await this.saveAllegroProdAccountsState(state);
    return { id: account.id, label: account.label };
  }

  async setDefaultAllegroProdAccount(accountId: string) {
    await this.loadAllegroProdAccountsState();
    const state = this.requireAllegroProdAccountsState();
    if (!state.accounts.some((account) => account.id === accountId)) {
      throw new NotFoundException("Allegro account not found");
    }

    if (state.activeAccountId !== accountId) {
      state.activeAccountId = accountId;
      state.updatedAt = new Date().toISOString();
      await this.saveAllegroProdAccountsState(state);
    }
    return { activeAccountId: accountId };
  }

  async deleteAllegroProdAccount(accountId: string) {
    await this.loadAllegroProdAccountsState();
    const state = this.requireAllegroProdAccountsState();
    const remainingAccounts = state.accounts.filter((account) => account.id !== accountId);

    if (remainingAccounts.length === state.accounts.length) {
      throw new UnauthorizedException("Allegro account not found");
    }

    const updatedAt = new Date().toISOString();
    state.accounts = remainingAccounts;
    state.activeAccountId = remainingAccounts[0]?.id;
    state.updatedAt = updatedAt;
    await this.saveAllegroProdAccountsState(state);
    return { activeAccountId: state.activeAccountId ?? "", accounts: remainingAccounts.map(({ id, label }) => ({ id, label })) };
  }

  async getAllegroProdAccessToken(accountId?: string): Promise<string> {
    await this.loadAllegroProdAccountsState();
    const state = this.requireAllegroProdAccountsState();
    const targetAccountId = accountId || state.activeAccountId || state.accounts[0].id;
    if (!this.pendingAllegroProdTokens.has(targetAccountId)) {
      const pendingToken = this.resolveAllegroProdAccessToken(targetAccountId).finally(() => {
        this.pendingAllegroProdTokens.delete(targetAccountId);
      });
      this.pendingAllegroProdTokens.set(targetAccountId, pendingToken);
    }
    return this.pendingAllegroProdTokens.get(targetAccountId)!;
  }

  private async resolveAllegroProdAccessToken(accountId?: string): Promise<string> {
    await this.loadAllegroProdAccountsState();
    const state = this.requireAllegroProdAccountsState();
    const targetAccountId = accountId || state.activeAccountId || state.accounts[0]?.id;
    const account = state.accounts.find((item) => item.id === targetAccountId);

    if (
      account
      && Date.parse(account.accessTokenExpiresAt) > Date.now() + 60_000
    ) {
      return account.accessToken;
    }

    if (!account?.refreshToken) {
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
      refresh_token: account.refreshToken,
    });
    const response = await axios.post<AllegroProdTokenResponse>(
      TOKEN_URL_prod,
      data,
      { headers },
    );
    return this.saveAllegroProdTokenResponse(
      response.data,
      account.refreshToken,
      account.label,
      account.id,
      false,
    ).then((nextAccount) => nextAccount.accessToken);
  }

  private async saveAllegroProdTokenResponse(
    response: AllegroProdTokenResponse,
    fallbackRefreshToken = "",
    label = "",
    accountId = "",
    makeActive = true,
  ): Promise<Required<AllegroProdTokenState>> {
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

    await this.loadAllegroProdAccountsState();
    const state = this.allegroProdAccountsState ?? {
      accounts: [],
      updatedAt: new Date().toISOString(),
    };
    const userName = this.getJwtPayload(accessToken)?.user_name?.toString() ?? "";
    const now = new Date().toISOString();
    const existingAccount = accountId
      ? state.accounts.find((account) => account.id === accountId)
      : undefined;
    const existingByRefreshToken = state.accounts.find((account) => account.refreshToken === refreshToken);
    const existingByUserName = userName
      ? state.accounts.find((account) => account.userName === userName)
      : undefined;
    const targetAccount = existingAccount ?? existingByUserName ?? existingByRefreshToken;
    const nextAccount: Required<AllegroProdTokenState> = {
      id: targetAccount?.id ?? randomUUID(),
      label: targetAccount?.label || label.trim() || `Konto Allegro ${state.accounts.length + 1}`,
      userName: userName || targetAccount?.userName || "",
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      updatedAt: now,
    };

    state.accounts = targetAccount
      ? state.accounts.map((account) => account.id === targetAccount.id ? nextAccount : account)
      : [...state.accounts, nextAccount];
    state.activeAccountId = makeActive
      ? nextAccount.id
      : state.activeAccountId ?? nextAccount.id;
    state.updatedAt = now;

    this.allegroProdAccountsState = state;
    this.allegroProdAccountsStateLoaded = true;
    await this.saveAllegroProdAccountsState(state);
    return nextAccount;
  }

  private async loadAllegroProdAccountsState(): Promise<void> {
    if (this.allegroProdAccountsStateLoaded) return;
    if (!this.pendingAllegroProdAccountsLoad) {
      this.pendingAllegroProdAccountsLoad = this.readAllegroProdAccountsState();
    }
    try {
      await this.pendingAllegroProdAccountsLoad;
    } finally {
      this.pendingAllegroProdAccountsLoad = undefined;
    }
  }

  private async readAllegroProdAccountsState(): Promise<void> {
    try {
      const rawState = await readFile(this.getAllegroTokenFilePath(), "utf8");
      const parsedState = JSON.parse(rawState) as AllegroProdTokenState | AllegroProdAccountsState;
      const state = this.normalizeAllegroProdAccountsState(parsedState);
      if (!state) {
        throw new Error("Invalid Allegro token state");
      }
      this.allegroProdAccountsState = state;
      if (JSON.stringify(parsedState) !== JSON.stringify(state)) {
        await this.saveAllegroProdAccountsState(state);
      }
      this.allegroProdAccountsStateLoaded = true;
    } catch (error) {
      if (
        error
        && typeof error === "object"
        && "code" in error
        && error.code === "ENOENT"
      ) {
        this.allegroProdAccountsStateLoaded = true;
        return;
      }
      throw new InternalServerErrorException("Cannot read Allegro token state");
    }
  }

  private async saveAllegroProdAccountsState(
    state: AllegroProdAccountsState,
  ): Promise<void> {
    const pendingWrite = this.allegroProdAccountsWrite.catch(() => undefined).then(async () => {
      const tokenFilePath = this.getAllegroTokenFilePath();
      const temporaryPath = `${tokenFilePath}.${process.pid}.${randomUUID()}.tmp`;
      await mkdir(dirname(tokenFilePath), { recursive: true, mode: 0o700 });
      await writeFile(temporaryPath, JSON.stringify(state, null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
      await rename(temporaryPath, tokenFilePath);
      await chmod(tokenFilePath, 0o600);
    });
    this.allegroProdAccountsWrite = pendingWrite;
    await pendingWrite;
  }

  private requireAllegroProdAccountsState(): AllegroProdAccountsState {
    const state = this.allegroProdAccountsState;
    if (!state || state.accounts.length === 0) {
      throw new UnauthorizedException("Allegro authorization is required");
    }
    return state;
  }

  private normalizeAllegroProdAccountsState(
    state: AllegroProdTokenState | AllegroProdAccountsState,
  ): AllegroProdAccountsState | undefined {
    if ("accounts" in state && Array.isArray(state.accounts)) {
      const deduplicatedAccounts = new Map<string, Required<AllegroProdTokenState>>();
      state.accounts
        .filter((account) =>
          typeof account.accessToken === "string"
          && typeof account.accessTokenExpiresAt === "string"
          && typeof account.refreshToken === "string"
        )
        .forEach((account, index) => {
          const userName = typeof account.userName === "string" && account.userName.trim()
            ? account.userName.trim()
            : this.getJwtPayload(account.accessToken)?.user_name?.toString() ?? "";
          const normalizedAccount: Required<AllegroProdTokenState> = {
            id: typeof account.id === "string" && account.id.trim() ? account.id : randomUUID(),
            label: typeof account.label === "string" && account.label.trim()
            ? account.label.trim()
            : `Konto Allegro ${index + 1}`,
            userName,
            accessToken: account.accessToken,
            accessTokenExpiresAt: account.accessTokenExpiresAt,
            refreshToken: account.refreshToken,
            updatedAt: typeof account.updatedAt === "string" ? account.updatedAt : new Date().toISOString(),
          };
          const key = userName || normalizedAccount.id;
          deduplicatedAccounts.set(key, normalizedAccount);
        });
      const accounts = [...deduplicatedAccounts.values()];

      return {
        activeAccountId: accounts.some((account) => account.id === state.activeAccountId)
          ? state.activeAccountId
          : accounts[0]?.id,
        accounts,
        updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : new Date().toISOString(),
      };
    }

    const legacyState = state as AllegroProdTokenState;
    if (
      typeof legacyState.accessToken === "string"
      && typeof legacyState.accessTokenExpiresAt === "string"
      && typeof legacyState.refreshToken === "string"
    ) {
      const account: Required<AllegroProdTokenState> = {
        id: typeof legacyState.id === "string" && legacyState.id.trim() ? legacyState.id : randomUUID(),
        label: typeof legacyState.label === "string" && legacyState.label.trim() ? legacyState.label : "Konto zapisane",
        userName: typeof legacyState.userName === "string" && legacyState.userName.trim()
          ? legacyState.userName.trim()
          : this.getJwtPayload(legacyState.accessToken)?.user_name?.toString() ?? "",
        accessToken: legacyState.accessToken,
        accessTokenExpiresAt: legacyState.accessTokenExpiresAt,
        refreshToken: legacyState.refreshToken,
        updatedAt: typeof legacyState.updatedAt === "string" ? legacyState.updatedAt : new Date().toISOString(),
      };

      return {
        activeAccountId: account.id,
        accounts: [account],
        updatedAt: account.updatedAt,
      };
    }

    return undefined;
  }

  private getAllegroTokenFilePath(): string {
    const configuredPath = this.config.get("allegroTokenFile", { infer: true });
    return configuredPath?.trim()
      ? resolve(configuredPath.trim())
      : resolve(__dirname, "..", "..", ".data", "allegro-tokens.json");
  }

  private getJwtExpiration(token: string): string | undefined {
    const payload = this.getJwtPayload(token);
    return typeof payload?.exp === "number"
      ? new Date(payload.exp * 1000).toISOString()
      : undefined;
  }

  private getJwtPayload(token: string): Record<string, unknown> | undefined {
    try {
      return JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
      ) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
}
