import type { TemplateKey } from "./templateSettings";

export type TemplateBlock = { id: string; label: string; selector: string; index?: number; parentSelector?: string };

const pc: TemplateBlock[] = [
    { id: "summary", label: "Wstęp i specyfikacja", selector: "#mainContainer > .poleasingowe_section", index: 0 },
    { id: "aio", label: "Sekcja All in One", selector: "#mainContainer > .poleasingowe_section", index: 1 },
    { id: "photo", label: "Zdjęcie produktu", selector: "#poleasingowe_photo_container" },
    { id: "details", label: "Szczegółowe opisy podzespołów", selector: ".poleasingowe_section2" },
    { id: "cpu", label: "Opis procesora", selector: '.poleasingowe_section2 img[src$="/cpu.png"]', parentSelector: ".poleasingowe_boxes" },
    { id: "ram", label: "Opis pamięci RAM", selector: '.poleasingowe_section2 img[src$="/ram.png"]', parentSelector: ".poleasingowe_boxes" },
    { id: "disk", label: "Opis dysku", selector: '.poleasingowe_section2 img[src$="/drive.png"]', parentSelector: ".poleasingowe_boxes" },
    { id: "gpu", label: "Opis karty graficznej", selector: '.poleasingowe_section2 img[src$="/gpu.png"]', parentSelector: ".poleasingowe_boxes" },
];
const gaming: TemplateBlock[] = [
    { id: "header", label: "Nagłówek", selector: ".g_bimg2" },
    { id: "features", label: "Najważniejsze cechy", selector: ".g_specBox2" },
    { id: "gpu", label: "Opis karty graficznej", selector: ".g_specBox3", index: 0 },
    { id: "cpu", label: "Opis procesora", selector: ".g_specBox1" },
    { id: "ram", label: "Opis pamięci RAM", selector: ".g_specBox3", index: 1 },
    { id: "disk", label: "Opis dysku", selector: ".g_specBox1b", index: 0 },
    { id: "monitor", label: "Monitor w zestawie", selector: ".g_specBox1b_monitor" },
];
const monitor: TemplateBlock[] = [
    { id: "summary", label: "Opis i specyfikacja", selector: ".monitors_section", index: 0 },
    { id: "ips", label: "Technologia IPS", selector: ".monitors_section", index: 1 },
    { id: "tn", label: "Technologia TN", selector: ".monitors_section", index: 2 },
    { id: "resolution", label: "Rozdzielczość", selector: ".monitors_section", index: 3 },
    { id: "ports", label: "Złącza i przewody", selector: ".monitors_section", index: 4 },
    { id: "ecology", label: "Stan poleasingowy", selector: ".monitors_section", index: 5 },
    { id: "pivot", label: "Funkcja Pivot", selector: ".monitors_section", index: 6 },
];
const laptopNew: TemplateBlock[] = [
    { id: "features", label: "Najważniejsze cechy", selector: ".features-section" },
    { id: "webcam", label: "Cecha: kamerka", selector: ".features-section .laptop_featureBox", index: 6 },
    { id: "modem", label: "Cecha: modem 4G", selector: ".features-section .laptop_featureBox", index: 7 },
    { id: "disk", label: "Dysk", selector: ".laptop_section3" },
    { id: "included", label: "Wyposażenie w zestawie", selector: ".include-section" },
    { id: "condition", label: "Stan wizualny", selector: ".grade-section" },
];
const phone: TemplateBlock[] = [
    { id: "warning", label: "Informacja o stanie", selector: ".warning" },
    { id: "specifications", label: "Specyfikacja", selector: ".spec" },
    { id: "system", label: "System operacyjny", selector: ".section_system" },
    { id: "camera", label: "Cechy aparatu", selector: ".spec svg.lucide-camera-icon", parentSelector: ".spec_element_w2" },
    { id: "wireless", label: "Ładowanie bezprzewodowe", selector: ".spec svg.lucide-zap-icon", parentSelector: ".spec_element" },
    { id: "dual-sim", label: "Dual SIM", selector: ".spec svg.lucide-diamond-icon", parentSelector: ".spec_element" },
    { id: "waterproof", label: "Wodoodporność", selector: ".spec svg.lucide-bubbles-icon", parentSelector: ".spec_element" },
];

const blocks: Partial<Record<TemplateKey, TemplateBlock[]>> = {
    pc, gaming, monitor, "laptop-new": laptopNew,
    "damaged-laptop": [{ id: "condition", label: "Opis stanu", selector: ".damagedLaptops_section" }],
    ios: phone, android: phone,
};

export function getTemplateBlockCatalog(key: TemplateKey): TemplateBlock[] {
    return blocks[key] ?? [];
}
