import { TemplateKey, LocalizedText } from "./templateSettings";
import {
    cpuTypesDescriptions, cpuTypesDescriptionsCZ, cpuTypesDescriptionsSK,
    ramTypesDescriptions, ramTypesDescriptionsCZ, ramTypesDescriptionsSK,
    diskTypesDescriptions, diskTypesDescriptionsCZ, diskTypesDescriptionsSK,
} from "./addProduct/additionalDescriptions/pcAdditionalDescription";
import {
    gaming_gpu, gaming_gpu_CZ, gaming_gpu_SK,
    gaming_cpuTypesDescriptions, gaming_cpuTypesDescriptions_CZ, gaming_cpuTypesDescriptions_SK,
    gaming_ramTypesDescriptions, gaming_ramTypesDescriptions_CZ, gaming_ramTypesDescriptions_SK,
    gaming_diskTypesDescriptions, gaming_diskTypesDescriptions_CZ, gaming_diskTypesDescriptions_SK,
} from "./addProduct/additionalDescriptions/gamingDescriptions";
import {
    monitorVC, monitorVC_CZ, monitorVC_SK,
    matrixGradeDescriptiosCZ, matrixGradeDescriptiosSK,
    GradeDescriptionsCZ, GradeDescriptionsSK,
    batteryDescriptionCZ, batteryDescriptionSK,
} from "./addProduct/additionalDescriptions/visualConditionDescriptions";
import {
    matrixGradeDescriptios, GradeDescriptios, batteryDescription,
} from "./addProduct/templates/laptopTemplate";

export type CatalogEntry = { id: string; label: string; text: LocalizedText };
type Dictionary = Record<string, string>;

function group(groupName: string, pl: Dictionary, cz: Dictionary, sk: Dictionary): CatalogEntry[] {
    const localized = (values: Dictionary, option: string) => values[option]
        ?? Object.entries(values).find(([key]) => key.startsWith(`${option} `))?.[1]
        ?? "";
    return Object.entries(pl).flatMap(([option, value]) => {
        // Short fragments such as "Klasa A" can appear elsewhere in a generated description.
        if (value.trim().length < 25 || /[<>]/.test(value)) return [];
        return [{
            id: `${groupName}:${option}`,
            label: `${groupName}: ${option}`,
            text: { pl: value.trim(), cz: localized(cz, option).trim(), sk: localized(sk, option).trim() },
        }];
    });
}

const pc = [
    ...group("Procesor", cpuTypesDescriptions, cpuTypesDescriptionsCZ, cpuTypesDescriptionsSK),
    ...group("RAM", ramTypesDescriptions, ramTypesDescriptionsCZ, ramTypesDescriptionsSK),
    ...group("Dysk", diskTypesDescriptions, diskTypesDescriptionsCZ, diskTypesDescriptionsSK),
];
const gaming = [
    ...group("Procesor", gaming_cpuTypesDescriptions, gaming_cpuTypesDescriptions_CZ, gaming_cpuTypesDescriptions_SK),
    ...group("RAM", gaming_ramTypesDescriptions, gaming_ramTypesDescriptions_CZ, gaming_ramTypesDescriptions_SK),
    ...group("Dysk", gaming_diskTypesDescriptions, gaming_diskTypesDescriptions_CZ, gaming_diskTypesDescriptions_SK),
    ...group("Grafika", gaming_gpu, gaming_gpu_CZ, gaming_gpu_SK),
];
const laptop = [
    ...group("Matryca", matrixGradeDescriptios, matrixGradeDescriptiosCZ, matrixGradeDescriptiosSK),
    ...group("Stan", GradeDescriptios, GradeDescriptionsCZ, GradeDescriptionsSK),
    ...group("Bateria", batteryDescription, batteryDescriptionCZ, batteryDescriptionSK),
];
const monitor = group("Stan matrycy", monitorVC, monitorVC_CZ, monitorVC_SK);

const catalog: Partial<Record<TemplateKey, CatalogEntry[]>> = {
    pc, gaming, monitor, laptop, "laptop-new": laptop,
};

export function getTemplateDescriptionCatalog(key: TemplateKey): CatalogEntry[] {
    return catalog[key] ?? [];
}
