import type { CopyEntry } from '../templateDescriptionCatalog';
import { escapeCopy, savedCopy, sanitizeInlineCopy } from '../templateCopy';
import legacy from './officeSpecLegacy.json';

const lines = {
    cpu: ['Procesor', ' {{rdzenie}}-rdzeniowy procesor <b>{{seria}}-{{model}}</b>, taktowanie <b>{{bazowe}}GHz</b> w trybie turbo <b>{{turbo}}GHz</b>'],
    ram: ['Pamięć RAM', ' Pamięć operacyjna <b>{{pojemnosc}} {{typ}}</b>'],
    disk: ['Dysk', ' Dysk: <b>{{typ}} {{pojemnosc}} GB</b>'],
    noDisk: ['Brak dysku', '<b>Brak dysku w zestawie</b>'],
    system: ['System operacyjny', ' Zainstalowany system: <b>{{system}}</b>'],
    noSystem: ['Brak systemu', '<b>Brak systemu operacyjnego</b>'],
    chassis: ['Obudowa', ' {{opis}} <b>{{typ}}</b>'],
    gpu: ['Karta graficzna', ' Karta graficzna <b>{{grafika}}</b>'],
    included: ['Wyposażenie', ' W zestawie: <b>{{wyposazenie}}</b>'],
    dvd: ['Napęd', ' Napęd: <b>{{naped}}</b>'],
    ports: ['Porty', ' Porty: <b>{{porty}}</b>'],
    resolution: ['Rozdzielczość', ' Rozdzielczość: <b>{{rozdzielczosc}}</b>'],
    panel: ['Typ matrycy', ' Typ matrycy: <b>{{matryca}} </b>'],
    size: ['Rozmiar ekranu', ' Rozmiar ekranu: <b>{{przekatna}} </b>'],
    frequency: ['Odświeżanie', ' Częstotliwość odświeżania ekranu: <b>{{odswiezanie}} </b>'],
    touch: ['Ekran dotykowy', ' Ekran dotykowy: <b>{{dotyk}}</b>'],
    mic: ['Mikrofon', ' Mikrofon: <b>{{mikrofon}}</b>'],
    camera: ['Kamera', ' Kamerka internetowa: <b>{{kamera}}</b>'],
    stand: ['Podstawka AIO', ' Podstawka AIO: <b>{{podstawka}}</b>'],
    cpuTitle: ['Nagłówek procesora', '➡️ Procesor {{seria}}-{{model}}'],
    ramTitle: ['Nagłówek RAM', '➡️ Pamięć RAM {{pojemnosc}} {{typ}}'],
    diskTitle: ['Nagłówek dysku', '➡️ Dysk {{typ}} {{pojemnosc}} GB'],
    gpuTitle: ['Nagłówek grafiki', '➡️ Karta graficzna {{grafika}}'],
} as const;

export type OfficeRow = keyof typeof lines;
const group = (key: OfficeRow) => key.endsWith('Title') ? 'Nagłówki podzespołów' :
    ['resolution','panel','size','frequency','touch','mic','camera','stand'].includes(key) ? 'Specyfikacja AIO' : 'Specyfikacja techniczna';
const rowId = (key: OfficeRow) => 'pl:wiersz:' + key;
const slots = /\{\{([a-z]+)\}\}/g;
const legacyTokens: Record<string,Record<string,string>> = legacy;

export function rowVariables(row: OfficeRow) {
    return [...new Set(Array.from(lines[row][1].matchAll(slots), m => m[1]))];
}

export function rowError(row: OfficeRow, source: string) {
    const names = rowVariables(row);
    for (const match of source.matchAll(/\{\{([^{}]*)\}\}/g)) {
        if (!names.includes(match[1])) return 'Nieznane pole: ' + match[0];
    }
    return /[{}]/.test(source.replace(slots,'')) ? 'Pole formularza musi mieć postać {{nazwa}}.' : '';
}

const example: Record<string,string> = {
    rdzenie:'6', seria:'Intel Core i5', model:'10500', bazowe:'3,1', turbo:'4,5', system:'Windows 11 Pro',
    opis:'Rodzaj obudowy:', grafika:'Intel UHD Graphics 630', wyposazenie:'Kabel zasilający', naped:'DVD',
    porty:'USB, DisplayPort', rozdzielczosc:'1920 × 1080', matryca:'IPS', przekatna:'24″', odswiezanie:'60 Hz',
    dotyk:'Tak', mikrofon:'Nie', kamera:'Tak', podstawka:'oryginalna',
};
export function previewOfficeRow(row: OfficeRow, source: string) {
    const ram = row === 'ram' || row === 'ramTitle';
    const fields = { ...example, typ: row === 'chassis' ? 'SFF' : ram ? 'DDR4' : 'SSD', pojemnosc: ram ? '16 GB' : '512' } as Record<string,string>;
    return sanitizeInlineCopy(source.replace(slots, (token,name:string) => fields[name] ?? token));
}

export function officeCatalog(): CopyEntry[] {
    return (Object.keys(lines) as OfficeRow[]).map(row => ({
        row, id:rowId(row), language:'pl', group:'Allegro → ' + group(row), label:lines[row][0], original:lines[row][1],
    }));
}

// Old fragment IDs were shared between rows (e.g. "GHz"). Never delete them when resetting a single row.
export function officeRowDefault(row: OfficeRow, lookup: (id:string) => string | undefined) {
    const source = lines[row][1];
    const tokens = legacyTokens[group(row)];
    return source.split(/(<[^>]+>|\{\{[a-z]+\}\})/g).map(part => {
        const text = part.trim();
        const edit = tokens[text] && lookup(tokens[text]);
        return edit === undefined || !tokens[text] ? part : part.replace(text, () => escapeCopy(edit).replace(/[{}]/g, c => c === '{' ? '&#123;' : '&#125;'));
    }).join('');
}

export function officeRow(row:OfficeRow, fields:Record<string,unknown> = {}) {
    const lookup = (id:string) => savedCopy('pc',id);
    const edit = lookup(rowId(row));
    const source = edit ?? officeRowDefault(row,lookup);
    const html = source.replace(slots, (_, name:string) => {
        if (!Object.prototype.hasOwnProperty.call(fields,name)) return '';
        const value = String(fields[name]);
        if (['dotyk','mikrofon','kamera'].includes(name)) {
            const legacyId = legacyTokens['Specyfikacja AIO'][value];
            if (legacyId && lookup(legacyId) !== undefined) return escapeCopy(lookup(legacyId)!);
        }
        return edit === undefined || name === 'podstawka' ? value : escapeCopy(value);
    });
    return edit === undefined ? html : sanitizeInlineCopy(html);
}
