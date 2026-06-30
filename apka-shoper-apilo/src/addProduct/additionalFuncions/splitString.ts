export function splitCommaList(input: string): string[] {
    if (typeof input !== "string") return [];
    return input
        .split(/,(?!\d)/)      // nie tnij, jeśli po przecinku stoi cyfra
        .map(s => s.trim())
        .filter(Boolean);
}