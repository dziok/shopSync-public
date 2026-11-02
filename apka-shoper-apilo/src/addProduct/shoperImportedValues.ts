export const shoperFieldWasProvided = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.some(shoperFieldWasProvided);
    if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        for (const key of ["value", "values", "value_id", "valueId", "option_id", "optionId"]) {
            if (key in record) return shoperFieldWasProvided(record[key]);
        }
    }
    return true;
};

export const shoperImportedAttributeNames = (entries: Array<[number, unknown]>): string[] =>
    entries.filter(([, value]) => shoperFieldWasProvided(value)).map(([id]) => `attribute_${id}`);

export const readShoperProductAttributes = (raw: unknown): {
    entries: Array<[number, unknown]>;
    groupIds: number[];
} => {
    const payload = raw && typeof raw === "object" && !Array.isArray(raw) && "list" in raw && Array.isArray(raw.list)
        ? raw.list
        : raw;
    const entries: Array<[number, unknown]> = [];
    const groupIds: number[] = [];

    if (Array.isArray(payload)) {
        payload.forEach((item) => {
            if (!item || typeof item !== "object") return;
            const attribute = item as Record<string, unknown>;
            const id = Number(attribute.attribute_id ?? attribute.attributeId ?? attribute.id);
            if (!Number.isFinite(id)) return;
            entries.push([id, attribute.value ?? attribute.values ?? attribute.value_id ?? attribute.valueId ?? attribute]);
        });
    } else if (payload && typeof payload === "object") {
        Object.entries(payload).forEach(([key, value]) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                const groupId = Number(key);
                if (Number.isFinite(groupId)) groupIds.push(groupId);
                Object.entries(value).forEach(([attributeId, attributeValue]) => {
                    const id = Number(attributeId);
                    if (Number.isFinite(id)) entries.push([id, attributeValue]);
                });
            } else {
                const id = Number(key);
                if (Number.isFinite(id)) entries.push([id, value]);
            }
        });
    }

    return { entries, groupIds };
};

export const shoperEnabled = (value: unknown): boolean =>
    value === true || value === 1 ||
    (typeof value === "string" && ["1", "true", "tak", "yes"].includes(value.trim().toLowerCase()));
