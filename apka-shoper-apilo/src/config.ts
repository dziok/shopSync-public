const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const loopbackApiUrl = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?$/i.test(rawApiUrl ?? "");

export const API_URL = !loopbackApiUrl && rawApiUrl ? rawApiUrl : "/api";
