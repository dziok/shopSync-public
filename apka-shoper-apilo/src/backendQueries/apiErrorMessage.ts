import axios from "axios";
import { nameShoperAttributesInError, type NamedShoperAttribute } from "./shoperAttributeError";

const GENERIC_MESSAGES = new Set([
    "Bad Request", "Internal Server Error", "Request failed with status code 400",
    "Request failed with status code 500", "Network Error",
]);

const asText = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

const detailsFrom = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(detailsFrom);
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    const direct = [record.userMessage, record.error_description, record.errorDescription,
        record.description, record.detail, record.message]
        .flatMap((item) => Array.isArray(item) ? item.map(asText) : [asText(item)]);
    const nested = [record.errors, record.shoperError].flatMap(detailsFrom);
    return [...nested, ...direct].filter((item) => item && !GENERIC_MESSAGES.has(item));
};

export const getApiErrorMessage = (error: unknown, fallback: string, attributes: readonly NamedShoperAttribute[] = []): string => {
    const data = axios.isAxiosError(error) ? error.response?.data : error;
    const details = [...new Set(detailsFrom(data))];
    if (details.length) return nameShoperAttributesInError(details.slice(0, 3).join("\n"), attributes).slice(0, 700);
    if (axios.isAxiosError(error) && !error.response) {
        return "Brak połączenia z serwerem. Sprawdź połączenie i spróbuj ponownie.";
    }
    return fallback;
};
