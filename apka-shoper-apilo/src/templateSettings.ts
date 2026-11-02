import { getTemplateBlockCatalog } from "./templateBlocks";

export const TEMPLATE_NAMES = {
    pc: "Komputery biurowe",
    gaming: "Komputery gamingowe",
    monitor: "Monitory",
    custom: "Inne produkty",
    "damaged-laptop": "Uszkodzone laptopy",
    laptop: "Laptopy",
    "laptop-new": "Laptopy nowe",
    ios: "Urządzenia iOS",
    android: "Urządzenia Android",
    cpu: "Procesory",
} as const;
export type TemplateKey = keyof typeof TEMPLATE_NAMES;
export type Language = "pl" | "cz" | "sk";
export type LocalizedText = Record<Language, string>;
export type DescriptionRule = {
    id: string;
    placement: "before" | "after";
    field: "always" | "attribute" | "category" | "name" | "sku";
    attributeId: string;
    match: "equals" | "contains";
    value: string;
    text: LocalizedText;
};
export type BlockRule = {
    mode: "hide" | "show-when" | "hide-when";
    field: "attribute" | "category" | "name" | "sku";
    attributeId: string;
    match: "equals" | "contains";
    value: string;
};
export type TextReplacement = { id: string; label?: string; find: LocalizedText; text: LocalizedText };
export type TemplateSettings = {
    shoper: { categoryId: number | null; gaugeId: number | null; deliveryId: number | null; gfxId: number | null; pkwiu: string };
    apilo: { tax: number | null; status: number | null };
    allegro: { shippingRatesName: string; returnPolicyName: string; warrantyName: string };
    description: { before: LocalizedText; after: LocalizedText; rules: DescriptionRule[]; replacements: TextReplacement[]; blocks: Record<string, BlockRule> };
};
export type TemplateSettingsFile = {
    revision: number;
    updatedAt: string;
    templates: Record<TemplateKey, TemplateSettings>;
};

export const ACTIVE_TEMPLATE_KEYS: TemplateKey[] = [
    "pc", "gaming", "monitor", "custom", "damaged-laptop", "laptop-new", "ios", "android",
];

type ProductPayload = Record<string, unknown> & {
    attributes?: Record<string, unknown>;
    translations?: Record<string, Record<string, unknown> & { name?: string; description?: string }>;
    stock?: Record<string, unknown>;
    delivery?: Record<string, unknown> & { shippingRates?: Record<string, unknown> };
    afterSalesServices?: Record<string, unknown>;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("pl-PL");
const localizedKeys: Array<[string, Language]> = [["pl_PL", "pl"], ["cs_CZ", "cz"], ["sk_SK", "sk"]];

type Condition = Pick<DescriptionRule, "field" | "attributeId" | "match" | "value">;

function ruleValue(rule: Condition, payload: ProductPayload): string {
    if (rule.field === "always") return "";
    if (rule.field === "attribute") {
        const value = payload.attributes?.[rule.attributeId];
        return Array.isArray(value) ? value.join(", ") : String(value ?? "");
    }
    if (rule.field === "category") return String(payload.category_id ?? "");
    if (rule.field === "name") return String(payload.translations?.pl_PL?.name ?? payload.name ?? "");
    return String(payload.code ?? payload.sku ?? "");
}

function activeRule(rule: Condition, payload: ProductPayload): boolean {
    if (rule.field === "always") return true;
    const actual = normalize(ruleValue(rule, payload));
    const expected = normalize(rule.value);
    return !!expected && (rule.match === "equals" ? actual === expected : actual.includes(expected));
}

function asParagraphs(value: string): HTMLElement[] {
    return value.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        return paragraph;
    });
}

export function applyDescriptionSettings(
    html: string, language: Language, payload: ProductPayload, settings: TemplateSettings, templateKey?: TemplateKey,
): string {
    const description = settings.description;
    const matchingRules = description.rules.filter((rule) => activeRule(rule, payload));
    const additions = [description.before[language], description.after[language], ...matchingRules.map((rule) => rule.text[language])];
    const replacements = description.replacements.filter((item) => item.find[language]);
    const blockCatalog = templateKey ? getTemplateBlockCatalog(templateKey) : [];
    const hasBlockRules = blockCatalog.some((block) => description.blocks?.[block.id]);
    if (!additions.some(Boolean) && !replacements.length && !hasBlockRules && !html.includes('data-shopsync-template-extra')) return html;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    wrapper.querySelectorAll('[data-shopsync-template-extra="true"]').forEach((node) => node.remove());
    const blockTargets = new Map(blockCatalog.map((block) => {
        const nodes = [...wrapper.querySelectorAll(block.selector)].map((node) =>
            block.parentSelector ? node.closest(block.parentSelector) : node).filter((node): node is Element => !!node);
        return [block.id, block.index === undefined ? nodes : [nodes[block.index]].filter(Boolean)] as const;
    }));
    for (const block of blockCatalog) {
        const rule = description.blocks?.[block.id];
        if (!rule) continue;
        const matches = rule.mode !== "hide" && activeRule(rule, payload);
        const shouldRemove = rule.mode === "hide" ||
            (rule.mode === "show-when" && !matches) ||
            (rule.mode === "hide-when" && matches);
        if (!shouldRemove) continue;
        blockTargets.get(block.id)?.forEach((node) => node.remove());
    }
    if (replacements.length) {
        const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
            let value = node.textContent ?? "";
            for (const item of replacements) value = value.split(item.find[language]).join(item.text[language]);
            node.textContent = value;
        }
    }
    const before = [
        ...asParagraphs(description.before[language]),
        ...matchingRules.filter((rule) => rule.placement === "before").flatMap((rule) => asParagraphs(rule.text[language])),
    ];
    const after = asParagraphs(description.after[language]);
    const rules = matchingRules.filter((rule) => rule.placement !== "before")
        .flatMap((rule) => asParagraphs(rule.text[language]));
    if (before.length) {
        const section = document.createElement("div");
        section.dataset.shopsyncTemplateExtra = "true";
        section.append(...before);
        wrapper.prepend(section);
    }
    if (after.length || rules.length) {
        const section = document.createElement("div");
        section.dataset.shopsyncTemplateExtra = "true";
        section.append(...after, ...rules);
        wrapper.append(section);
    }
    return wrapper.innerHTML;
}

export function applyTemplateSettings(
    data: unknown, url: string, settings: TemplateSettings, previousPayload?: ProductPayload, templateKey?: TemplateKey,
): unknown {
    if (!data || typeof data !== "object") return data;
    const shoperCreate = /\/product\/shoper(?:\?|$)/.test(url);
    const shoperUpdate = /\/product\/\d+(?:\?|$)/.test(url);
    const apilo = /\/product\/apilo(?:\?|$)/.test(url);
    const allegro = /\/product\/allegroProduct(?:\/account)?(?:\?|$)/.test(url);

    if (apilo && Array.isArray(data)) {
        return data.map((item) => {
            const next: ProductPayload = { ...(item as ProductPayload) };
            if (settings.apilo.tax !== null) next.tax = settings.apilo.tax;
            if (settings.apilo.status !== null) next.status = settings.apilo.status;
            if (typeof next.description === "string") {
                next.description = applyDescriptionSettings(next.description, "pl", { ...previousPayload, ...next, attributes: previousPayload?.attributes }, settings, templateKey);
            }
            return next;
        });
    }
    if (Array.isArray(data)) return data;
    const payload: ProductPayload = { ...(data as ProductPayload) };

    if (shoperCreate || shoperUpdate) {
        if (shoperCreate || payload.category_id !== undefined) {
            if (settings.shoper.categoryId !== null) payload.category_id = settings.shoper.categoryId;
            if (settings.shoper.gaugeId !== null) payload.gauge_id = settings.shoper.gaugeId;
            if (settings.shoper.pkwiu) payload.pkwiu = settings.shoper.pkwiu;
            if (payload.stock && typeof payload.stock === "object") {
                payload.stock = { ...payload.stock };
                if (settings.shoper.deliveryId !== null) payload.stock.delivery_id = settings.shoper.deliveryId;
                if (settings.shoper.gfxId !== null) payload.stock.gfx_id = settings.shoper.gfxId;
            }
        }
        if (payload.translations) {
            const context = { ...previousPayload, ...payload, attributes: payload.attributes ?? previousPayload?.attributes };
            payload.translations = { ...payload.translations };
            for (const [key, language] of localizedKeys) {
                const translation = payload.translations[key];
                if (translation && typeof translation.description === "string") {
                    payload.translations[key] = {
                        ...translation,
                        description: applyDescriptionSettings(translation.description, language, context, settings, templateKey),
                    };
                }
            }
        }
    }
    if (allegro) {
        const policy = settings.allegro;
        if (policy.shippingRatesName) payload.delivery = {
            ...payload.delivery, shippingRates: { ...payload.delivery?.shippingRates, name: policy.shippingRatesName },
        };
        if (policy.returnPolicyName || policy.warrantyName) {
            payload.afterSalesServices = { ...payload.afterSalesServices };
            if (policy.returnPolicyName) payload.afterSalesServices.returnPolicy = { name: policy.returnPolicyName };
            if (policy.warrantyName) payload.afterSalesServices.impliedWarranty = { name: policy.warrantyName };
        }
    }
    return payload;
}
