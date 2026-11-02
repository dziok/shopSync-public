export const splitAdditionalFeatures = (value: string): string[] =>
    String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export const isAdditionalFeaturesName = (name?: string): boolean =>
    String(name ?? "").trim().toLocaleLowerCase("pl").replace(/\s+/g, " ") === "dodatkowe cechy";

export const findAdditionalFeaturesAttribute = <T extends { name?: string }>(attributes: T[]): T | undefined =>
    attributes.find((attribute) => isAdditionalFeaturesName(attribute.name));

export const resolveImportedAdditionalFeatures = (
    entries: Array<[number, unknown]>,
    attributeId: number,
    descriptionValue: string,
): string => {
    const entry = entries.find(([id]) => id === attributeId);
    if (!entry) return descriptionValue;
    const raw = entry[1];
    const value = raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw
        ? (raw as { value: unknown }).value
        : raw;
    return value == null ? "" : String(value);
};

const escapeHtml = (value: string): string => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderAdditionalFeatureItems = (value: string): string =>
    splitAdditionalFeatures(value).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");

export const translateAdditionalFeatures = async (
    value: string,
    translate: (text: string) => Promise<string>,
): Promise<string> => {
    const features = splitAdditionalFeatures(value);
    const translations = await Promise.all(features.map(translate));
    return translations.map((translation, index) => translation.trim() || features[index]).join("\n");
};

export const readAdditionalFeaturesFromDescription = (html: string, selector: string): string => {
    if (!html) return "";
    const template = document.createElement("template");
    template.innerHTML = html;
    return [...template.content.querySelectorAll(`${selector} li`)]
        .map((item) => item.textContent?.trim() ?? "")
        .filter(Boolean)
        .join("\n");
};
