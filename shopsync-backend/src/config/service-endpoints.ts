function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getEnvUrl(name: string, fallback: string) {
  const value = process.env[name];
  if (typeof value !== "string" || !value.trim()) {
    return trimTrailingSlash(fallback);
  }
  return trimTrailingSlash(value.trim());
}

export function getShoperRestBaseUrl() {
  return getEnvUrl(
    "SHOPER_REST_BASE_URL",
    "https://example-shop.shoper.pl/webapi/rest",
  );
}

export function getShoperStorefrontBaseUrl() {
  return getEnvUrl(
    "SHOPER_STOREFRONT_BASE_URL",
    "https://example-shop.com/webapi/front/pl_PL",
  );
}

export function getApiloBaseUrl() {
  return getEnvUrl("APILO_BASE_URL", "https://example.apilo.com/rest/api");
}
