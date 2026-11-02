type AioStandLocale = "pl" | "cz" | "sk";

const labels: Record<string, Record<AioStandLocale, string>> = {
    oryginalna: { pl: "oryginalna", cz: "originální", sk: "originálna" },
    zastępcza: { pl: "zastępcza", cz: "náhradní", sk: "náhradná" },
    brak: {
        pl: "brak (komputer sprzedawany bez podstawki)",
        cz: "není součástí balení (počítač se prodává bez stojanu)",
        sk: "nie je súčasťou balenia (počítač sa predáva bez stojana)",
    },
};

export const getAioStandDescription = (value: string, locale: AioStandLocale): string =>
    labels[String(value ?? "").trim().toLocaleLowerCase("pl-PL")]?.[locale] ?? "";
