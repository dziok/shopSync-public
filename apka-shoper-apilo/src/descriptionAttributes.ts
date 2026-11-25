import type { TemplateKey } from './templateSettings';

export const descriptionAttributes: Partial<Record<TemplateKey, Record<string, string>>> = {
    pc: { Procesor: '762', RAM: '763', Dysk: '773', System: '768', 'Klasa wizualna': '894' },
    'laptop-new': { 'Stan matrycy': '315', 'Klasa wizualna': '314', Bateria: '825', Klawiatura: '824' },
    monitor: { 'Stan matrycy': '856' },
};
