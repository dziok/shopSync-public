import type { Language, TemplateKey } from './templateSettings';
import { optionDictionary, isOptionHtml } from './templateCopy';
import { cpuTypesDescriptions, cpuTypesDescriptionsCZ, cpuTypesDescriptionsSK, ramTypesDescriptions, ramTypesDescriptionsCZ, ramTypesDescriptionsSK, diskTypesDescriptions, diskTypesDescriptionsCZ, diskTypesDescriptionsSK, systemType, systemTypeCZ, systemTypeSK, desktopStatus, desktopStatusCZ, desktopStatusSK } from './addProduct/additionalDescriptions/pcAdditionalDescription';
import { pcVC, pcCaseVC_CZ, pcCaseVC_SK, monitorVC, monitorVC_CZ, monitorVC_SK, monitorCaseVC, monitorCaseVC_CZ, monitorCaseVC_SK, matrixGradeDescriptiosCZ, matrixGradeDescriptiosSK, GradeDescriptionsCZ, GradeDescriptionsSK, batteryDescriptionCZ, batteryDescriptionSK, keyboardDescriptionCZ, keyboardDescriptionSK } from './addProduct/additionalDescriptions/visualConditionDescriptions';
import { gaming_cpuTypesDescriptions, gaming_cpuTypesDescriptions_CZ, gaming_cpuTypesDescriptions_SK, gaming_ramTypesDescriptions, gaming_ramTypesDescriptions_CZ, gaming_ramTypesDescriptions_SK, gaming_diskTypesDescriptions, gaming_diskTypesDescriptions_CZ, gaming_diskTypesDescriptions_SK, gaming_gpu, gaming_gpu_CZ, gaming_gpu_SK } from './addProduct/additionalDescriptions/gamingDescriptions';
import { matrixGradeDescriptios, GradeDescriptios, batteryDescription, keyboardDescription } from './addProduct/templates/laptopTemplate';
import { genericAmdDescriptions, homeAssistantSupportNotice } from './addProduct/additionalDescriptions/pcAdditionalDescription';
import { aioStandLabels } from './addProduct/aioStand';
import { officeCatalog, type OfficeRow } from './addProduct/officeSpecRows';

export type CopyEntry = { id: string; group: string; label: string; language: Language; original: string; html?: boolean; row?: OfficeRow; leaves?: import('./templateCopy').CopyLeaf[] };
type Dictionary = Record<string, string>;
type Group = [string, ...Record<string, Dictionary>[]];
const languages: Language[] = ['pl','cz','sk'];
const pc: Group[] = [
    ['Procesor', { cpuTypesDescriptions }, { cpuTypesDescriptionsCZ }, { cpuTypesDescriptionsSK }],
    ['RAM', { ramTypesDescriptions }, { ramTypesDescriptionsCZ }, { ramTypesDescriptionsSK }],
    ['Dysk', { diskTypesDescriptions }, { diskTypesDescriptionsCZ }, { diskTypesDescriptionsSK }],
    ['Klasa wizualna', { pcVC }, { pcCaseVC_CZ }, { pcCaseVC_SK }],
    ['System', { systemType }, { systemTypeCZ }, { systemTypeSK }],
    ['Stan', { desktopStatus }, { desktopStatusCZ }, { desktopStatusSK }],
    ['Wsparcie Allegro', { supportNotices: { 'Home Assistant': homeAssistantSupportNotice } }],
];
const gaming: Group[] = [
    ['Procesor', { gaming_cpuTypesDescriptions }, { gaming_cpuTypesDescriptions_CZ }, { gaming_cpuTypesDescriptions_SK }],
    ['RAM', { gaming_ramTypesDescriptions }, { gaming_ramTypesDescriptions_CZ }, { gaming_ramTypesDescriptions_SK }],
    ['Dysk', { gaming_diskTypesDescriptions }, { gaming_diskTypesDescriptions_CZ }, { gaming_diskTypesDescriptions_SK }],
    ['Grafika', { gaming_gpu }, { gaming_gpu_CZ }, { gaming_gpu_SK }],
];
const monitor: Group[] = [
    ['Stan matrycy', { monitorVC }, { monitorVC_CZ }, { monitorVC_SK }],
    ['Stan obudowy', { monitorCaseVC }, { monitorCaseVC_CZ }, { monitorCaseVC_SK }],
];
const laptop: Group[] = [
    ['Stan matrycy', { matrixGradeDescriptios }, { matrixGradeDescriptiosCZ }, { matrixGradeDescriptiosSK }],
    ['Klasa wizualna', { GradeDescriptios }, { GradeDescriptionsCZ }, { GradeDescriptionsSK }],
    ['Bateria', { batteryDescription }, { batteryDescriptionCZ }, { batteryDescriptionSK }],
    ['Klawiatura', { keyboardDescription }, { keyboardDescriptionCZ }, { keyboardDescriptionSK }],
];
const ios: Group[] = [
    ['Stan matrycy', { monitorVC }],
];
const android: Group[] = [
    ['Stan matrycy', { monitorVC }, { monitorVC_CZ }, { monitorVC_SK }],
];
const groups: Partial<Record<TemplateKey, Group[]>> = { pc, gaming, monitor, ios, android, laptop, 'laptop-new': laptop };
function each(key: TemplateKey, visit: (group: string, lang: Language, name: string, values: Dictionary) => void) {
    for (const [group, ...localized] of groups[key] ?? []) localized.forEach((dict, i) => {
        for (const [name, values] of Object.entries(dict)) visit(group, languages[i], name, values);
    });
}
export function getTemplateDescriptionCatalog(key: TemplateKey): CopyEntry[] {
    const entries: CopyEntry[] = [];
    each(key, (group, language, _, values) => {
        for (const [label, original] of Object.entries(values)) {
            const id = language + ':' + group + ':' + label;
            entries.push({ id, language, group, label, original, html: isOptionHtml(original) });
        }
    });
    if (key === 'pc') for (const language of languages) entries.push({ id: language + ':Procesor:Pozostałe AMD', group: 'Procesor', label: 'Pozostałe AMD', language, original: genericAmdDescriptions[language] });
    if (key === 'custom') entries.push({ id: 'pl:Produkt:Opis początkowy', group: 'Produkt', label: 'Opis początkowy', language: 'pl', original: '' });
    if (key === 'pc') for (const [label, values] of Object.entries(aioStandLabels)) for (const language of languages)
        entries.push({ id: language + ':Podstawka AIO:' + label, group: 'Podstawka AIO', label, language, original: values[language] });
    if (key === 'pc' || key === 'gaming') entries.push(...officeCatalog(key));
    return entries;
}
export function templateDictionaries(key: TemplateKey) {
    const result: Record<string, Dictionary> = {};
    each(key, (group, language, name, values) => { result[name] = optionDictionary(key, language, group, values); });
    return result;
}
