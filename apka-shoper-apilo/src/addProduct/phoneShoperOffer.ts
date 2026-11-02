import type { Attribute } from "../types";
import { phoneFieldForAttribute } from "./phoneShoperAttributes";

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
    value !== null && typeof value === "object" && !Array.isArray(value);

export function phoneOfferProduct(payload: unknown): RecordValue {
    if (!isRecord(payload)) throw new Error("Shoper nie zwrócił danych produktu.");
    const product = isRecord(payload.product) ? payload.product : payload;
    if (!Object.keys(product).length) throw new Error("Shoper nie zwrócił danych produktu.");
    return product;
}

export function phoneOfferGroupIds(product: RecordValue): number[] {
    if (!isRecord(product.attributes)) return [];
    return Object.entries(product.attributes)
        .filter(([, value]) => isRecord(value) && Object.keys(value).some(key => Number.isInteger(Number(key))))
        .map(([key]) => Number(key))
        .filter(id => Number.isInteger(id) && id > 0);
}

export function phoneOfferAttributeEntries(product: RecordValue): Array<[number, unknown]> {
    const raw = product.attributes ?? product.attribute;
    if (Array.isArray(raw)) {
        return raw.flatMap(item => {
            if (!isRecord(item)) return [];
            const id = Number(item.attribute_id ?? item.attributeId ?? item.id);
            return Number.isInteger(id) && id > 0
                ? [[id, item.value ?? item.values ?? item.value_id ?? item.valueId ?? item]] as Array<[number, unknown]>
                : [];
        });
    }
    if (!isRecord(raw)) return [];
    return Object.entries(raw).flatMap(([key, value]) => {
        if (isRecord(value) && !("value" in value) && !("option_id" in value)) {
            return Object.entries(value).flatMap(([attributeId, attributeValue]) => {
                const id = Number(attributeId);
                return Number.isInteger(id) && id > 0 ? [[id, attributeValue]] as Array<[number, unknown]> : [];
            });
        }
        const id = Number(key);
        return Number.isInteger(id) && id > 0 ? [[id, value]] as Array<[number, unknown]> : [];
    });
}

function unwrapValue(raw: unknown): unknown {
    if (Array.isArray(raw)) return unwrapValue(raw[0]);
    if (isRecord(raw)) return unwrapValue(raw.value ?? raw.value_id ?? raw.valueId ?? raw.option_id ?? raw.optionId);
    return raw;
}

function displayValue(attribute: Attribute, raw: unknown): string | boolean {
    const value = unwrapValue(raw);
    if (String(attribute.type) === "1") {
        return value === true || value === 1 || ["1", "true", "tak", "yes"].includes(String(value ?? "").toLowerCase());
    }
    const text = String(value ?? "");
    if (String(attribute.type) === "2") {
        return attribute.options?.find(option => String(option.option_id) === text || option.value === text)?.value ?? text;
    }
    return text;
}

export function phoneOfferFormAttributes(product: RecordValue, attributes: Attribute[]): Record<string, string | boolean> {
    const byId = new Map(attributes.map(attribute => [Number(attribute.attribute_id), attribute]));
    const result: Record<string, string | boolean> = {};
    for (const [id, raw] of phoneOfferAttributeEntries(product)) {
        const importedValue = unwrapValue(raw);
        if (importedValue == null || importedValue === "") continue;
        const attribute = byId.get(id);
        if (!attribute) continue;
        const field = phoneFieldForAttribute(attribute);
        let value = displayValue(attribute, raw);
        if (field && String(attribute.type) === "0" && typeof value === "string") {
            if (["frontCamera", "backCamera"].includes(field)) value = value.replace(/\s*(?:mpx|mpix)$/i, "");
            if (field === "batteryCapacity") value = value.replace(/\s*mah$/i, "");
            if (field === "batteryStatus") value = value.replace(/\s*%$/, "");
            if (field === "diagonal") value = value.replace(/\s*"$/, "");
            if (field === "resolution") value = value.replace(/\s*px$/i, "");
        }
        result[field ?? `attribute_${id}`] = value;
    }
    return result;
}

const descriptionFields = [
    "additionalInfo", "additionalInfoCZ", "additionalInfoSK", "G5", "NFC", "wirelessCharging",
    "dualSim", "waterproof", "screenName", "screen", "matrixGrade", "resolution", "diagonal",
    "lens_ultraWide", "lens_tele", "lens_lidar", "category", "category_id", "backCamera", "frontCamera",
];

export function phoneDescriptionSignature(values: object): string {
    const fields = values as Record<string, unknown>;
    return JSON.stringify(descriptionFields.map(field => fields[field] ?? null));
}
