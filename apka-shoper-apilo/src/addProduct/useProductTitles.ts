import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { handleTranslateCZ, handleTranslateSK } from '../backendQueries/translate';
import { createTitleResolver } from './productTitleTranslations';

export function useProductTitles() {
    const [resolver] = useState(() => createTitleResolver(handleTranslateCZ, handleTranslateSK));
    const [preview, setPreview] = useState({ cs: '', sk: '' });
    const version = useRef(0);
    function seed(pl = '', cs = '', sk = '') {
        version.current++;
        setPreview(resolver.seed(pl, cs, sk));
    }
    async function prepare(title: string) {
        const revision = ++version.current;
        try {
            const result = await resolver.ensure(title);
            if (revision === version.current) setPreview(result);
            return result;
        } catch (error) {
            if (revision === version.current) toast.error(error instanceof Error ? error.message : 'Błąd tłumaczenia tytułu.');
            return null;
        }
    }
    return { seed, prepare, nameCZ: preview.cs, nameSK: preview.sk };
}
