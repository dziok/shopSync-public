import { templateCopy } from '../templateCopy';
type AioStandLocale = "pl" | "cz" | "sk";

export const aioStandLabels: Record<string, Record<AioStandLocale, string>> = {
    oryginalna: { pl: "oryginalna", cz: "originální", sk: "originálna" },
    zastępcza: { pl: "zastępcza", cz: "náhradní", sk: "náhradná" },
    brak: {
        pl: "brak (komputer sprzedawany bez podstawki)",
        cz: "není součástí balení (počítač se prodává bez stojanu)",
        sk: "nie je súčasťou balenia (počítač sa predáva bez stojana)",
    },
};

export const getAioStandDescription = (value: string, locale: AioStandLocale): string => {
    const key = String(value ?? "").trim().toLocaleLowerCase("pl-PL");
    return templateCopy('pc', locale + ':Podstawka AIO:' + key, aioStandLabels[key]?.[locale] ?? "");
};
