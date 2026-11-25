import axios from 'axios';

type Field = { id: string; name: string; dictionary?: unknown };
type Parameters = { parameters?: readonly ({ id?: unknown } | null)[] };
type Offer = Parameters & { productSet?: readonly { product?: Parameters }[] };
const meaningful = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    return /^(an error has occurred|bad request|unprocessable entity|request failed with status code \d+)[.!]?$/i.test(text) ? '' : text;
};

export function allegroOfferError(error: unknown, catalog: readonly Field[], offer: Offer): string {
    const response = axios.isAxiosError(error) ? error.response : undefined;
    if (axios.isAxiosError(error) && !response) return 'Brak odpowiedzi z serwera. Sprawdź szkice Allegro przed ponowieniem.';
    const data = response?.data;
    const issues = Array.isArray(data?.errors) ? data.errors : [];
    const messages = new Set<string>();
    for (const issue of issues) {
        if (!issue) continue;
        const message = meaningful(issue.userMessage) || meaningful(issue.message) || meaningful(issue);
        const text = [issue.userMessage, issue.message, issue.code].join(' ');
        const path = String(issue.path ?? '');
        const at = /^(?:productSet\[(\d+)\]\.product\.)?parameters\[(\d+)\]/.exec(path);
        const fromPath = at && (at[1] === undefined ? offer : offer.productSet?.[Number(at[1])]?.product)?.parameters?.[Number(at[2])]?.id;
        const id = /\bparamet(?:er|ru|r|rem)\b\s*(?:id\s*)?[:#="'„\s]*(\d+)/i.exec(text)?.[1]
            ?? issue.metadata?.parameterId ?? fromPath;
        const field = catalog.find(f => f.id === String(id));
        const label = field ? `Pole „${field.name}” (ID ${field.id})` : id ? `Parametr Allegro ${id}` : '';
        if (label && /valuesIds|rangeValue/i.test(text)) {
            messages.add(`${label}: Allegro odrzuciło wartość. ${field?.dictionary ? 'Sprawdź wybór na liście opcji.' : 'Sprawdź wartość i jej format.'}`);
        } else if (message) {
            messages.add(label ? `${label}: ${message}` : message);
        } else if (label) messages.add(`${label}: sprawdź wartość w formularzu Allegro.`);
    }
    if (!messages.size) {
        const fallback = meaningful(data?.message) || meaningful(data) || (!axios.isAxiosError(error) && error instanceof Error ? meaningful(error.message) : '');
        messages.add(fallback || (response?.status === 401 ? 'Zaloguj się ponownie na wybrane konto Allegro.'
            : response?.status === 403 ? 'Wybrane konto nie ma uprawnień do tej operacji.'
            : `Serwer nie podał szczegółowej przyczyny${response?.status ? ' (HTTP ' + response.status + ')' : ''}.`));
    }
    return 'Nie udało się wystawić oferty Allegro.\n' + [...messages].join('\n');
}
