import { createTitleResolver } from './productTitleTranslations';

export async function prepareGamingTitles(value: string | undefined, cz: (s: string) => Promise<string>, sk: (s: string) => Promise<string>) {
    return createTitleResolver(cz, sk).ensure(value ?? '');
}
