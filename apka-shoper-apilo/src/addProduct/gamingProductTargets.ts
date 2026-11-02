export function getCreatedShoperProductId(response: unknown): number {
    const data = response as { product_id?: unknown; id?: unknown; data?: { product_id?: unknown; id?: unknown } } | null;
    const rawId = data && typeof data === 'object'
        ? data.product_id ?? data.id ?? data.data?.product_id ?? data.data?.id
        : response;
    const id = typeof rawId === 'number' || typeof rawId === 'string' ? Number(rawId) : NaN;
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('Shoper nie zwrócił poprawnego ID nowo utworzonego produktu. Aktualizacja została wstrzymana.');
    }
    return id;
}

export function getExactApiloProductId(
    response: { totalCount?: number; products?: Array<{ id?: number | string; productId?: number | string; product_id?: number | string; sku?: string }> },
    sku: string,
): number | string | null {
    const products = response.products ?? [];
    const matches = products.filter(product => product.sku === sku);
    if (matches.length > 1 || (response.totalCount ?? products.length) > products.length) {
        throw new Error('Wyniki Apilo są niejednoznaczne. Nie usunięto żadnego produktu.');
    }
    if (matches.length === 0) {
        if (products.length && products.some(product => !product.sku)) {
            throw new Error('Apilo nie zwróciło SKU produktu. Nie można bezpiecznie wskazać produktu do usunięcia.');
        }
        return null;
    }
    const id = matches[0].id ?? matches[0].productId ?? matches[0].product_id;
    if (typeof id !== 'number' && typeof id !== 'string' || !String(id).trim()) {
        throw new Error('Apilo nie zwróciło ID produktu o wskazanym SKU.');
    }
    return id;
}
