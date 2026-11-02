import axios from "axios";
import { nameShoperAttributesInError, type NamedShoperAttribute } from "./shoperAttributeError";

const MAX_MESSAGE_LENGTH = 1200;

const stringifyValue = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const collectMessages = (value: unknown): string[] => {
    if (value == null) return [];
    if (typeof value === "string") return [value];
    if (typeof value === "number" || typeof value === "boolean") return [String(value)];
    if (Array.isArray(value)) return value.flatMap(collectMessages);
    if (typeof value !== "object") return [String(value)];

    const objectValue = value as Record<string, unknown>;
    const descriptiveMessages = [
        objectValue.userMessage,
        objectValue.error_description,
        objectValue.errorDescription,
        objectValue.description,
        objectValue.detail,
        objectValue.message,
    ].flatMap(collectMessages);
    const technicalMessages = [
        objectValue.error,
    ].flatMap(collectMessages);

    if (descriptiveMessages.length) {
        const firstTechnicalMessage = technicalMessages.find(Boolean);
        return firstTechnicalMessage
            ? [...descriptiveMessages, `Kod błędu: ${firstTechnicalMessage}`]
            : descriptiveMessages;
    }

    if (technicalMessages.length) return technicalMessages;

    return Object.entries(objectValue).flatMap(([key, nestedValue]) =>
        collectMessages(nestedValue).map((message) => `${key}: ${message}`)
    );
};

export const getShoperErrorMessage = (error: unknown, attributes: readonly NamedShoperAttribute[] = []) => {
    if (!axios.isAxiosError(error)) {
        return "Wystąpił błąd podczas dodawania produktu do Shopera.";
    }

    const responseData = error.response?.data as Record<string, unknown> | undefined;
    const shoperError = responseData?.shoperError ?? responseData;
    const messages = collectMessages(shoperError)
        .map((message) => message.trim())
        .filter(Boolean);
    const uniqueMessages = [...new Set(messages)];
    const message = uniqueMessages.length
        ? uniqueMessages.join("\n")
        : stringifyValue(shoperError) || error.message;

    const namedMessage = nameShoperAttributesInError(message, attributes);
    return namedMessage.length > MAX_MESSAGE_LENGTH
        ? `${namedMessage.slice(0, MAX_MESSAGE_LENGTH)}...`
        : namedMessage;
};
