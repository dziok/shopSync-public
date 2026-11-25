type Translator = (text: string) => Promise<string>;
type Titles = { pl: string; cs: string; sk: string };

export function createTitleResolver(cs: Translator, sk: Translator) {
    let current = { pl: '', cs: '', sk: '' };
    let pending: Promise<Titles> | undefined;
    function seed(pl = '', cz = '', slovak = '') {
        pending = undefined;
        current = { pl: String(pl ?? '').trim(), cs: String(cz ?? '').trim(), sk: String(slovak ?? '').trim() };
        return current;
    }
    async function ensure(title: string) {
        const pl = String(title ?? '').trim();
        if (!pl) throw new Error('Uzupełnij polski tytuł produktu.');
        if (pl !== current.pl) seed(pl);
        if (current.cs && current.sk) return current;
        if (pending) return pending;
        const snapshot = current;
        async function resolve(existing: string, translate: Translator, language: string) {
            const result = existing || (await translate(pl).catch(() => ''))?.trim();
            if (!result) throw new Error(`Nie udało się przetłumaczyć tytułu na język ${language}. Nie wysłano zmian do Shopera.`);
            return result;
        }
        const request = Promise.all([resolve(snapshot.cs, cs, 'czeski'), resolve(snapshot.sk, sk, 'słowacki')])
            .then(([cs, sk]) => {
                const titles = { pl, cs, sk };
                if (current === snapshot) current = titles;
                return titles;
            }).finally(() => { if (pending === request) pending = undefined; });
        pending = request;
        return request;
    }
    return { ensure, seed };
}
