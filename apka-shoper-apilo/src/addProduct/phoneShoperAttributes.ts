import type { Attribute } from "../types";

export function getPhoneCategoryGroupIds(category: unknown): number[] {
    if (!category || typeof category !== "object") return [];
    const record = category as Record<string, any>;
    const translations = record.translations;
    const polishTranslation = Array.isArray(translations)
        ? translations.find(item => ["pl_PL", "pl", "PL"].includes(String(item?.locale ?? item?.lang ?? item?.language ?? "")))
            ?? (translations.length === 1 ? translations[0] : undefined)
        : translations?.pl_PL;
    const groups = [
        polishTranslation?.attribute_groups,
        record.translation?.attribute_groups,
        record.attribute_groups,
        record.attributeGroups,
    ].flatMap(raw => Array.isArray(raw) ? raw : raw == null ? [] : [raw]);
    return [...new Set(groups
        .map(group => Number(typeof group === "object" ? group?.attribute_group_id ?? group?.id : group))
        .filter(id => Number.isInteger(id) && id > 0))];
}

export type PhoneAttributeField =
    | "caseGrade" | "connection" | "model" | "frontCamera" | "backCamera"
    | "screen" | "system" | "waterproof" | "dualSim" | "wirelessCharging"
    | "NFC" | "G5" | "resolution" | "matrixGrade" | "cpu"
    | "batteryCapacity" | "batteryStatus" | "diagonal" | "ramAmount"
    | "diskSize" | "warranty" | "additionalInfo" | "screenName"
    | "simType" | "lens_ultraWide" | "lens_tele" | "lens_lidar";

const names: Record<PhoneAttributeField, string[]> = {
    caseGrade: ["stan obudowy"],
    connection: ["złącze", "złącza", "rodzaj złącza"],
    model: ["model", "model telefonu"],
    frontCamera: ["aparat przedni", "aparat przód", "rozdzielczość aparatu przedniego", "rozdzielczość aparatu przedniego (mpix)"],
    backCamera: ["aparat tylny", "aparat tylni", "aparat tył", "rozdzielczość aparatu tylnego", "rozdzielczość aparatu tylnego (mpix)"],
    screen: ["typ ekranu", "rodzaj ekranu", "typ wyświetlacza", "rodzaj wyświetlacza"],
    system: ["system", "system operacyjny"],
    waterproof: ["wodoodporność", "wodoodporny", "wodoszczelność"],
    dualSim: ["dual sim", "dual-sim", "dual sim (dwie karty sim)"],
    wirelessCharging: ["ładowanie bezprzewodowe", "ładowanie indukcyjne"],
    NFC: ["nfc"],
    G5: ["5g", "obsługa 5g"],
    resolution: ["rozdzielczość", "rozdzielczość ekranu", "rozdzielczość wyświetlacza"],
    matrixGrade: ["stan matrycy", "stan wyświetlacza"],
    cpu: ["procesor", "model procesora"],
    batteryCapacity: ["pojemność baterii", "pojemność akumulatora", "pojemność baterii (mah)"],
    batteryStatus: ["kondycja baterii", "stan baterii", "kondycja baterii (%)"],
    diagonal: ["przekątna ekranu", "przekątna wyświetlacza", "przekątna ekranu (cale)"],
    ramAmount: ["pamięć ram", "ilość pamięci ram", "wielkość pamięci ram"],
    diskSize: ["pojemność dysku", "pamięć wbudowana", "pojemność pamięci", "pojemność pamięci wewnętrznej"],
    warranty: ["gwarancja", "okres gwarancji"],
    additionalInfo: ["uwagi", "uwagi do produktu", "dodatkowe informacje"],
    screenName: ["nazwa ekranu", "nazwa wyświetlacza"],
    simType: ["rodzaj karty sim", "typ karty sim", "karta sim"],
    lens_ultraWide: ["obiektyw szerokokątny", "obiektyw ultraszerokokątny"],
    lens_tele: ["teleobiektyw", "obiektyw tele"],
    lens_lidar: ["czujnik głębi", "czujnik głębi lidar", "lidar"],
};

const normalize = (value: string) => value.toLocaleLowerCase("pl-PL")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

export function isPhoneEnabled(value: unknown): boolean {
    return value === true || ["tak", "true", "1", "yes"].includes(normalize(String(value ?? "")));
}

export function formatPhoneMatrixGrade(value: string, description?: string): string {
    if (!value) return "";
    return description ? `${value} (${description})` : value;
}

export const PHONE_ATTRIBUTE_FIELDS = Object.keys(names) as PhoneAttributeField[];
export const PHONE_ATTRIBUTE_GROUP_ID = 16;
const optionalFields: PhoneAttributeField[] = ["additionalInfo", "screenName", "simType", "lens_ultraWide", "lens_tele", "lens_lidar"];

export function phoneAttributeGroupIds(categoryGroupIds: number[], manualGroupId = ""): number[] {
    return [...new Set([PHONE_ATTRIBUTE_GROUP_ID, ...categoryGroupIds, Number(manualGroupId)])]
        .filter(id => Number.isInteger(id) && id > 0);
}

function matchesPhoneAttribute(attribute: Attribute, field: PhoneAttributeField): boolean {
    const aliases = names[field].map(normalize);
    const name = normalize(attribute.name);
    const withoutUnit = normalize(attribute.name.replace(/\s*\((?:mpx|mpix|mah|gb|px|%|cale)\)\s*$/i, ""));
    return aliases.includes(name) || aliases.includes(withoutUnit);
}

export function findPhoneAttribute(attributes: Attribute[], field: PhoneAttributeField): Attribute | undefined {
    return attributes.find(attribute => matchesPhoneAttribute(attribute, field));
}

export function phoneFieldForAttribute(attribute: Attribute): PhoneAttributeField | undefined {
    return PHONE_ATTRIBUTE_FIELDS.find(field => matchesPhoneAttribute(attribute, field));
}

export function missingPhoneAttributes(attributes: Attribute[]): string[] {
    return PHONE_ATTRIBUTE_FIELDS
        .filter(field => !optionalFields.includes(field))
        .filter(field => !findPhoneAttribute(attributes, field))
        .map(field => names[field][0]);
}

export function additionalPhoneAttributes(attributes: Attribute[]): Attribute[] {
    return attributes.filter(attribute => !PHONE_ATTRIBUTE_FIELDS.some(field => matchesPhoneAttribute(attribute, field)));
}

type PhoneValues = Partial<Record<PhoneAttributeField, string | boolean | number | undefined>>;

const withUnit = (value: string, unit: string) => value.toLocaleLowerCase().endsWith(unit.toLocaleLowerCase()) ? value : `${value} ${unit}`;

export function buildPhoneShoperAttributes(attributes: Attribute[], values: PhoneValues, includeDefaultWarranty = true): Record<number, string | boolean> {
    if (!attributes.length) throw new Error("Nie pobrano atrybutów Shoper dla wybranej kategorii.");
    const result: Record<number, string | boolean> = {};
    const invalid: string[] = [];
    for (const field of PHONE_ATTRIBUTE_FIELDS) {
        if (field === "warranty" && !includeDefaultWarranty) continue;
        const matchingAttributes = attributes.filter(attribute => matchesPhoneAttribute(attribute, field));
        if (!matchingAttributes.length) continue;
        const raw = field === "warranty" ? "24 miesiące" : values[field];
        if (raw === undefined || raw === null || raw === "") continue;
        for (const attribute of matchingAttributes) {
            if (String(attribute.type) === "1") {
                result[attribute.attribute_id] = isPhoneEnabled(raw);
                continue;
            }
            let value = String(raw).trim();
            if (String(attribute.type) === "2") {
                const options = attribute.options ?? [];
                const candidates = [value];
                if (["frontCamera", "backCamera"].includes(field)) candidates.push(withUnit(value, "Mpx"));
                if (field === "resolution") candidates.push(withUnit(value, "px"));
                if (field === "batteryCapacity") candidates.push(withUnit(value, "mAh"));
                if (field === "batteryStatus") candidates.push(withUnit(value, "%"));
                if (field === "diagonal") candidates.push(value.endsWith('"') ? value : `${value}\"`);
                if (typeof raw === "boolean") candidates.push(raw ? "Tak" : "Nie");
                const selected = options.find(option => candidates.some(candidate => normalize(option.value) === normalize(candidate)));
                if (!selected) {
                    invalid.push(`${attribute.name}: ${value}`);
                    continue;
                }
                value = selected.value;
            } else {
                if (["frontCamera", "backCamera"].includes(field)) value = withUnit(value, "Mpx");
                if (field === "resolution") value = withUnit(value, "px");
                if (field === "batteryCapacity") value = withUnit(value, "mAh");
                if (field === "batteryStatus") value = withUnit(value, "%");
                if (field === "diagonal" && !value.endsWith('"')) value = `${value}\"`;
            }
            result[attribute.attribute_id] = value;
        }
    }
    if (invalid.length) throw new Error(`Wartości nie są dostępne w atrybutach Shoper: ${invalid.join(", ")}. Zmień je lub dodaj opcje w Shoperze.`);
    const formValues = values as Record<string, unknown>;
    for (const attribute of additionalPhoneAttributes(attributes)) {
        const raw = formValues[`attribute_${attribute.attribute_id}`];
        if (raw === undefined || raw === null || raw === "") continue;
        if (String(attribute.type) === "1") {
            result[attribute.attribute_id] = raw === true;
        } else if (String(attribute.type) === "2") {
            const option = (attribute.options ?? []).find(item => String(item.value) === String(raw));
            if (!option) throw new Error(`Wartość atrybutu ${attribute.name} nie jest dostępna w Shoperze.`);
            result[attribute.attribute_id] = option.value;
        } else if (String(attribute.type) === "0") {
            result[attribute.attribute_id] = String(raw).trim();
        }
    }
    return result;
}
