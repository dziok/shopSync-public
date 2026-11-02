export const imageFileKey = (file: Pick<File, "name" | "size" | "lastModified">) =>
    JSON.stringify([file.name, file.size, file.lastModified]);

export function appendUniqueImages<T extends Pick<File, "name" | "size" | "lastModified">>(previous: T[], files: T[]): T[] {
    const known = new Set(previous.map(imageFileKey));
    const additions = files.filter(file => {
        const key = imageFileKey(file);
        if (known.has(key)) return false;
        known.add(key);
        return true;
    }).sort((a, b) => {
        const numberA = Number(a.name.match(/\d+/)?.[0] ?? 0);
        const numberB = Number(b.name.match(/\d+/)?.[0] ?? 0);
        return numberA - numberB;
    });
    return additions.length ? [...previous, ...additions] : previous;
}

export function moveImageItem<T>(items: T[], from: number, to: number): T[] {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}
