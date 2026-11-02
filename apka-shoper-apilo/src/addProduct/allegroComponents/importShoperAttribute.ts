import type { Attribute } from "../../types";

const textValues = (value: unknown): string[] => (Array.isArray(value) ? value : [value])
    .filter((item): item is string | number | boolean =>
        typeof item === "string" || typeof item === "number" || typeof item === "boolean")
    .map(item => String(item).trim())
    .filter(Boolean);

const normalizeOption = (value: string): string => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/×/g, "x")
    .replace(/,/g, ".")
    .replace(/\s*(?:px|hz|ms)\s*$/i, "")
    .replace(/[^a-z0-9+-]/g, "");

export function resolveImportedShoperAttribute(attribute: Attribute, rawValue: unknown): string | boolean | undefined {
    const values = textValues(rawValue);
    if (!values.length) return undefined;

    if (String(attribute.type) === "1") {
        const normalized = normalizeOption(values[0]);
        if (["tak", "true", "1", "yes", "on"].includes(normalized)) return true;
        if (["nie", "false", "0", "no", "off"].includes(normalized)) return false;
        return undefined;
    }

    if (String(attribute.type) === "2" || attribute.options?.length) {
        const options = attribute.options ?? [];
        for (const value of values) {
            const exact = options.find(option => String(option.value).trim() === value);
            if (exact) return exact.value;
            const normalized = normalizeOption(value);
            if (!normalized) continue;
            const equivalents = normalized === "true" ? ["true", "tak", "yes", "1"]
                : normalized === "false" ? ["false", "nie", "no", "0"] : [normalized];
            const matches = options.filter(option => equivalents.includes(normalizeOption(String(option.value))));
            if (matches.length === 1) return matches[0].value;
        }
        return undefined;
    }

    return values.join(", ");
}

export function resolveShoperSelectValue(attribute: Attribute, rawValue: unknown): string | undefined {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value == null || value === "") return undefined;

    if (typeof value === "object") {
        const selected = value as { option_id?: unknown; optionId?: unknown; value?: unknown };
        const optionId = selected.option_id ?? selected.optionId;
        if (optionId != null) {
            const option = attribute.options?.find(item => String(item.option_id) === String(optionId));
            if (option) return option.value;
        }
        return selected.value != null ? resolveShoperSelectValue(attribute, selected.value) : undefined;
    }

    const byId = attribute.options?.find(option => String(option.option_id) === String(value));
    if (byId) return byId.value;
    const matched = resolveImportedShoperAttribute(attribute, value);
    return typeof matched === "string" ? matched : undefined;
}
