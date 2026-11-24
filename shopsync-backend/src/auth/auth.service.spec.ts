import axios from "axios";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { Config } from "../config/config";
import { ApiloTokenService } from "./apilo-token.service";
import { AuthService } from "./auth.service";

const token = (userName: string, exp: number) =>
  `header.${Buffer.from(JSON.stringify({ user_name: userName, exp })).toString("base64url")}.signature`;

describe("AuthService Allegro accounts", () => {
  let directory: string;
  let file: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "shopsync-allegro-"));
    file = join(directory, "allegro-tokens.json");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  const createService = () => {
    const config = {
      get: jest.fn((key: keyof Config) => ({
        allegroTokenFile: file,
        allegroProdClientId: "client-id",
        allegroProdClientSecret: "client-secret",
      })[key]),
    } as unknown as ConfigService<Config, true>;
    return new AuthService(
      {} as HttpService,
      config,
      {} as JwtService,
      {} as ApiloTokenService,
    );
  };

  const account = (id: string, userName: string, expired: boolean) => ({
    id,
    label: `Konto ${userName}`,
    userName,
    accessToken: token(userName, expired ? 1_600_000_000 : 4_000_000_000),
    accessTokenExpiresAt: expired ? "2020-01-01T00:00:00Z" : "2096-01-01T00:00:00Z",
    refreshToken: `refresh-${id}`,
    updatedAt: "2026-01-01T00:00:00Z",
  });

  const saveAccounts = async (accounts: ReturnType<typeof account>[]) => {
    await writeFile(file, JSON.stringify({
      activeAccountId: accounts[0].id,
      accounts,
      updatedAt: "2026-01-01T00:00:00Z",
    }));
  };

  it("keeps both saved accounts visible when one refresh token is rejected", async () => {
    await saveAccounts([account("first", "rysiek", true), account("second", "tokrzysiek", false)]);
    jest.spyOn(axios, "post").mockRejectedValue(Object.assign(new Error("invalid_grant"), {
      isAxiosError: true,
      response: { data: { error: "invalid_grant" }, status: 400 },
    }));

    const result = await createService().getAllegroProdAccounts();

    expect(result.accounts).toEqual([
      expect.objectContaining({ id: "first", status: "login_required", access_token: "" }),
      expect.objectContaining({ id: "second", status: "connected", access_token: expect.any(String) }),
    ]);
    expect((JSON.parse(await readFile(file, "utf8")).accounts)).toHaveLength(2);
  });

  it("persists both concurrently refreshed accounts without losing either rotation", async () => {
    await saveAccounts([account("first", "rysiek", true), account("second", "tokrzysiek", true)]);
    jest.spyOn(axios, "post").mockImplementation(async (_url, data) => {
      const id = String(data).includes("refresh-first") ? "first" : "second";
      const userName = id === "first" ? "rysiek" : "tokrzysiek";
      return { data: {
        access_token: token(userName, 4_000_000_000),
        refresh_token: `rotated-${id}`,
        expires_in: 3600,
      } };
    });

    const result = await createService().getAllegroProdAccounts();
    const persisted = JSON.parse(await readFile(file, "utf8"));

    expect(result.accounts.map((item) => item.status)).toEqual(["connected", "connected"]);
    expect(persisted.accounts.map((item: { refreshToken: string }) => item.refreshToken)).toEqual([
      "rotated-first", "rotated-second",
    ]);
    expect((await createService().getAllegroProdAccounts()).accounts).toHaveLength(2);
  });

  it("refreshes the active account only once when requested both by default and by ID", async () => {
    await saveAccounts([account("first", "rysiek", true)]);
    const post = jest.spyOn(axios, "post").mockResolvedValue({ data: {
      access_token: token("rysiek", 4_000_000_000),
      refresh_token: "rotated-first",
      expires_in: 3600,
    } });
    const service = createService();

    const [defaultToken, namedToken] = await Promise.all([
      service.getAllegroProdAccessToken(),
      service.getAllegroProdAccessToken("first"),
    ]);

    expect(defaultToken).toBe(namedToken);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("persists the chosen default Allegro account across service restarts", async () => {
    await saveAccounts([account("first", "rysiek", false), account("second", "tokrzysiek", false)]);

    await createService().setDefaultAllegroProdAccount("second");

    expect(JSON.parse(await readFile(file, "utf8")).activeAccountId).toBe("second");
    expect((await createService().getAllegroProdAccounts()).activeAccountId).toBe("second");
  });

  it("does not change the default when the selected account does not exist", async () => {
    await saveAccounts([account("first", "rysiek", false)]);

    await expect(createService().setDefaultAllegroProdAccount("missing")).rejects.toThrow();

    expect(JSON.parse(await readFile(file, "utf8")).activeAccountId).toBe("first");
  });
});

describe("AuthService app login", () => {
  afterEach(() => jest.restoreAllMocks());

  it("allows Shoper login when Apilo token refresh is rejected", async () => {
    const config = { get: jest.fn((key: keyof Config) => ({
      appUsername: "operator", appPassword: "secret",
    })[key]) } as unknown as ConfigService<Config, true>;
    const jwt = { sign: jest.fn().mockReturnValue("session-token") } as unknown as JwtService;
    const service = new AuthService({} as HttpService, config, jwt, {} as ApiloTokenService);
    jest.spyOn(service, "authorizeShoper").mockResolvedValue("shoper-token");
    jest.spyOn(service, "authorizeApilo").mockRejectedValue(new Error("Apilo HTTP 401"));
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    await expect(service.loginShoperAndApilo({ login: "operator", password: "secret" }))
      .resolves.toEqual({ access_token: "session-token", apilo_available: false });
    expect(jwt.sign).toHaveBeenCalledWith({ shoperToken: "shoper-token" });
  });

  it("does not embed the Apilo token in a new application session", async () => {
    const jwt = { sign: jest.fn().mockReturnValue("session-token") } as unknown as JwtService;
    const service = new AuthService({} as HttpService, {} as ConfigService<Config, true>, jwt, {} as ApiloTokenService);

    expect(service.createSession("shoper-token")).toEqual({ access_token: "session-token" });
    expect(jwt.sign).toHaveBeenCalledWith({ shoperToken: "shoper-token" });
  });
});
