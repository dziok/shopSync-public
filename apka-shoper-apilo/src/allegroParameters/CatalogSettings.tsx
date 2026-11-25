import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { API_URL } from '../config';
import { getApiErrorMessage } from '../backendQueries/apiErrorMessage';
import { categoryIds, compareCatalog, resolveCatalog, type CatalogKey, type CatalogSnapshot } from './catalog';

type Props = {
    template: CatalogKey; authToken: string; accountId?: string; disabled: boolean;
    value?: CatalogSnapshot; onChange: (snapshot?: CatalogSnapshot) => void;
};
export default function CatalogSettings({ template, authToken, accountId, disabled, value, onChange }: Props) {
    const [preview, setPreview] = useState<CatalogSnapshot>();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const request = useRef<AbortController>();
    useEffect(() => () => request.current?.abort(), []);
    const diff = useMemo(() => preview
        ? compareCatalog(resolveCatalog(template, value), resolveCatalog(template, preview)) : null, [template, value, preview]);
    const check = async () => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setLoading(true); setError(''); setPreview(undefined);
        try {
            const { data } = await axios.get<CatalogSnapshot>(`${API_URL}/product/template-parameters/${template}`, {
                params: { allegroAccountId: accountId }, headers: { Authorization: `Bearer ${authToken}` }, signal: controller.signal,
            });
            if (data.categoryId !== categoryIds[template] || !data.parameters?.length) throw new Error('Nieprawidłowa kategoria.');
            if (!controller.signal.aborted) setPreview(data);
        } catch (err) {
            if (!controller.signal.aborted) setError(getApiErrorMessage(err, 'Nie udało się pobrać parametrów z Allegro.'));
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return <Stack component="section" spacing={1.5} sx={{ mt: 3 }}>
        <Typography variant="h6">Parametry kategorii Allegro</Typography>
        <Typography variant="body2">Kategoria {categoryIds[template]} · {value
            ? `Katalog API z ${new Date(value.fetchedAt).toLocaleString('pl-PL')}` : 'Katalog wbudowany'}</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="outlined" disabled={loading || disabled} onClick={check}>
                {loading ? 'Pobieranie…' : 'Sprawdź aktualizację'}</Button>
            {value && <Button disabled={loading || disabled} onClick={() => {
                setPreview(undefined); setError(''); onChange(undefined);
            }}>Przywróć katalog wbudowany</Button>}
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {preview && diff && <>
            <Typography variant="body2">{diff.changes.length ? `Zmiany: ${diff.changes.length}` : 'Brak zmian w polach i regułach.'}</Typography>
            {!!diff.changes.length && <ul style={{ maxHeight: 240, overflowY: 'auto', marginBlock: 0 }}>
                {diff.changes.map(line => <li key={line}>{diff.details.has(line)
                    ? <details><summary>{line}</summary><ul>{diff.details.get(line)!.map(item => <li key={item}>{item}</li>)}</ul></details>
                    : line}</li>)}</ul>}
            {!!diff.conflicts.length && <Alert severity="warning">Aktualizacja wymaga dostosowania formularza:
                <ul>{diff.conflicts.map(line => <li key={line}>{line}</li>)}</ul></Alert>}
            <Stack direction="row" gap={1}>
                <Button variant="outlined" disabled={disabled || !!diff.conflicts.length}
                    onClick={() => { onChange(preview); setPreview(undefined); }}>Wybierz ten katalog</Button>
                <Button onClick={() => setPreview(undefined)}>Anuluj</Button>
            </Stack>
        </>}
    </Stack>;
}
