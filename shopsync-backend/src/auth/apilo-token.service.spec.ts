import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { Config } from "../config/config";
import { ApiloTokenService } from "./apilo-token.service";

describe("ApiloTokenService", () => {
  let temporaryDirectory: string;
  let tokenFile: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "shopsync-apilo-"));
    tokenFile = join(temporaryDirectory, "apilo-tokens.json");
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  const createService = (
    configValues: Partial<Record<keyof Config, string>>,
    post = jest.fn(),
  ) => {
    const httpService = {
      axiosRef: { post },
    } as unknown as HttpService;
    const configService = {
      get: jest.fn((key: keyof Config) => configValues[key]),
    } as unknown as ConfigService<Config, true>;

    return {
      service: new ApiloTokenService(httpService, configService),
      post,
    };
  };

  it("exchanges the authorization code once and persists both tokens", async () => {
    const tokenResponse = {
      accessToken: "new-access-token",
      accessTokenExpireAt: "2099-01-01T00:00:00Z",
      refreshToken: "new-refresh-token",
      refreshTokenExpireAt: "2099-03-01T00:00:00Z",
    };
    const post = jest.fn().mockResolvedValue({ data: tokenResponse });
    const { service } = createService(
      {
        apiloAuthUrl: "https://sprzetowopl.apilo.com/rest/auth/token/",
        apiloClientId: "client-id",
        apiloClientSecret: "client-secret",
        apiloAuthorizationCode: "authorization-code",
        apiloTokenFile: tokenFile,
      },
      post,
    );

    const [firstToken, concurrentToken] = await Promise.all([
      service.getAccessToken(),
      service.getAccessToken(),
    ]);

    expect(firstToken).toBe(tokenResponse.accessToken);
    expect(concurrentToken).toBe(tokenResponse.accessToken);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      "https://sprzetowopl.apilo.com/rest/auth/token/",
      {
        grantType: "authorization_code",
        token: "authorization-code",
      },
      expect.objectContaining({
        auth: {
          username: "client-id",
          password: "client-secret",
        },
      }),
    );
    const savedState = JSON.parse(await readFile(tokenFile, "utf8"));
    expect(savedState).toEqual({
      ...tokenResponse,
      updatedAt: expect.any(String),
    });
  });

  it("uses a valid persisted access token without calling Apilo", async () => {
    const tokenState = {
      accessToken: "persisted-access-token",
      accessTokenExpireAt: "2099-01-01T00:00:00Z",
      refreshToken: "persisted-refresh-token",
      refreshTokenExpireAt: "2099-03-01T00:00:00Z",
    };
    await mkdir(dirname(tokenFile), { recursive: true });
    await writeFile(tokenFile, JSON.stringify(tokenState), "utf8");
    const { service, post } = createService({
      apiloTokenFile: tokenFile,
    });

    await expect(service.getAccessToken()).resolves.toBe(
      tokenState.accessToken,
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("refreshes an expired access token with the persisted refresh token", async () => {
    const expiredState = {
      accessToken: "expired-access-token",
      accessTokenExpireAt: "2020-01-01T00:00:00Z",
      refreshToken: "persisted-refresh-token",
      refreshTokenExpireAt: "2099-03-01T00:00:00Z",
    };
    const refreshedState = {
      accessToken: "refreshed-access-token",
      accessTokenExpireAt: "2099-01-01T00:00:00Z",
      refreshToken: "rotated-refresh-token",
      refreshTokenExpireAt: "2099-03-01T00:00:00Z",
    };
    await writeFile(tokenFile, JSON.stringify(expiredState), "utf8");
    const post = jest.fn().mockResolvedValue({ data: refreshedState });
    const { service } = createService(
      {
        apiloClientId: "client-id",
        apiloClientSecret: "client-secret",
        apiloBaseUrl: "https://sprzetowopl.apilo.com/rest/api",
        apiloTokenFile: tokenFile,
      },
      post,
    );

    await expect(service.getAccessToken()).resolves.toBe(
      refreshedState.accessToken,
    );
    expect(post).toHaveBeenCalledWith(
      "https://sprzetowopl.apilo.com/rest/auth/token/",
      {
        grantType: "refresh_token",
        token: expiredState.refreshToken,
      },
      expect.any(Object),
    );
  });

  it("returns token metadata without exposing either token", async () => {
    const tokenState = {
      accessToken: "private-access-token",
      accessTokenExpireAt: "2099-01-01T00:00:00Z",
      refreshToken: "private-refresh-token",
      refreshTokenExpireAt: "2099-03-01T00:00:00Z",
      updatedAt: "2026-07-31T12:00:00Z",
    };
    await writeFile(tokenFile, JSON.stringify(tokenState), "utf8");
    const { service } = createService({
      apiloTokenFile: tokenFile,
    });

    await expect(service.getStatus()).resolves.toEqual({
      status: "valid",
      accessTokenExpireAt: tokenState.accessTokenExpireAt,
      refreshTokenExpireAt: tokenState.refreshTokenExpireAt,
      automaticRefresh: true,
      lastRefreshedAt: tokenState.updatedAt,
    });
  });
});
