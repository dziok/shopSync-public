const packageJson = require("../../package.json") as { version?: string };

const DEFAULT_ALLEGRO_APP_NAME = "shopSync";
const DEFAULT_ALLEGRO_APP_URL = "https://github.com/dziok/shopSync-public";
const DEFAULT_ALLEGRO_APP_VERSION = packageJson.version ?? "0.0.1";

type AllegroUserAgentOptions = {
  appName?: string;
  appVersion?: string;
  appUrl?: string;
};

const normalizeValue = (value: string | undefined, fallback: string) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : fallback;
};

export const buildAllegroUserAgent = ({
  appName,
  appVersion,
  appUrl,
}: AllegroUserAgentOptions = {}) => {
  const resolvedAppName = normalizeValue(appName, DEFAULT_ALLEGRO_APP_NAME);
  const resolvedAppVersion = normalizeValue(
    appVersion,
    DEFAULT_ALLEGRO_APP_VERSION,
  );
  const resolvedAppUrl = normalizeValue(appUrl, DEFAULT_ALLEGRO_APP_URL);

  return `${resolvedAppName}/${resolvedAppVersion} (+${resolvedAppUrl})`;
};

export const withAllegroUserAgent = <T extends Record<string, string>>(
  headers: T,
  userAgent: string,
) => ({
  ...headers,
  "User-Agent": userAgent,
});
