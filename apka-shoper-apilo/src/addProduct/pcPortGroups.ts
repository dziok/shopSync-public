export type PcPortGroups = {
    casePorts: string[];
    motherboardPorts: string[];
    gpuPorts: string[];
};

export const toPcPortValues = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String).map((port) => port.trim()).filter(Boolean);
    if (typeof value !== "string") return [];
    try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) return toPcPortValues(parsed);
    } catch { /* Shoper also returns comma-separated values. */ }
    return value.split(/,(?!\d)/).map((port) => port.trim()).filter(Boolean);
};

export const createPcPortGroups = (casePorts: unknown, motherboardPorts: unknown, gpuPorts: unknown): PcPortGroups => ({
    casePorts: toPcPortValues(casePorts),
    motherboardPorts: toPcPortValues(motherboardPorts),
    gpuPorts: toPcPortValues(gpuPorts),
});

const escapeHtml = (value: string): string => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderPcPortGridRows = (
    groups: PcPortGroups,
    labels: { casePorts: string; motherboardPorts: string; gpuPorts: string },
): string => (Object.keys(labels) as Array<keyof PcPortGroups>)
    .filter((key) => groups[key].length > 0)
    .map((key) => `<dt>${labels[key]}</dt><dd><div class="pc_spec_chips">${groups[key].map((port) => `<span class="pc_spec_chip">${escapeHtml(port)}</span>`).join("")}</div></dd>`)
    .join("");

export const renderPcPortListItems = (
    groups: PcPortGroups,
    labels: { casePorts: string; motherboardPorts: string; gpuPorts: string },
): string => (Object.keys(labels) as Array<keyof PcPortGroups>)
    .filter((key) => groups[key].length > 0)
    .map((key) => `<li><b class="poleasingowe_b">${labels[key]}:</b> ${groups[key].map(escapeHtml).join(", ")}</li>`)
    .join("");

export const isPcPortGroups = (value: unknown): value is PcPortGroups =>
    !!value && typeof value === "object" && "casePorts" in value && "motherboardPorts" in value && "gpuPorts" in value;
