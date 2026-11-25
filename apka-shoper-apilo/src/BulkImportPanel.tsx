import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { createTheme, ThemeProvider } from '@mui/material/styles';
const importTheme = createTheme({ palette: { mode: 'dark', background: { paper: '#262626' } } });
import AiSettingsPanel from './AiSettingsPanel';
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { API_URL } from './config';
import { getApiErrorMessage } from './backendQueries/apiErrorMessage';
import { assignDeliveryPhotos, type DeliveryProduct } from './bulkFormMapping';
import type { Attribute } from './types';
import { ColumnMapping, defaultMapping, ImportDraft, ImportRow, ImportTemplate, makeDrafts, TEMPLATE_LABELS, validateDraft } from './bulkImport';

type AiResult = { template: ImportTemplate; title: string; fields: { name: string; value: string }[]; issues: string[]; confidence: number; usage?: { inputTokens: number; outputTokens: number } };

export default function BulkImportPanel({ authToken, visible, editing, notice, onBack, onOpen }: {
    authToken: string; visible: boolean; editing: boolean; notice: string; onBack: () => void; onOpen: (product: DeliveryProduct) => void
}) {
    const [photos, setPhotos] = useState<Record<number, File[]>>({});
    const [unmatchedPhotos, setUnmatchedPhotos] = useState<string[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({ sku: '', manufacturer: '', model: '', price: '', condition: '' });
    const [drafts, setDrafts] = useState<ImportDraft[]>([]);
    const [configured, setConfigured] = useState(false);
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [usage, setUsage] = useState({ input: 0, output: 0 });
    const cancelled = useRef(false);
    const api = { headers: { Authorization: `Bearer ${authToken}` } };

    useEffect(() => () => { cancelled.current = true; }, [visible]);

    const loadFile = (file?: File) => {
        if (!file) return;
        if (file.size > 5_000_000) { toast.error('Plik CSV może mieć maksymalnie 5 MB.'); return; }
        Papa.parse<ImportRow>(file, {
            header: true, skipEmptyLines: 'greedy', transformHeader: header => header.replace(/^\uFEFF/, '').trim(),
            complete: result => {
                if (result.errors.length) { toast.error(`Nieprawidłowy CSV: ${result.errors[0].message}`); return; }
                const parsed = result.data.filter(row => Object.values(row).some(value => String(value || '').trim()));
                if (!parsed.length || parsed.length > 500) { toast.error('Plik musi zawierać od 1 do 500 produktów.'); return; }
                const nextHeaders = result.meta.fields || [];
                const nextMapping = defaultMapping(nextHeaders);
                setHeaders(nextHeaders); setRows(parsed); setMapping(nextMapping);
                setPhotos({});
                setUnmatchedPhotos([]);
                setDrafts(makeDrafts(parsed, nextMapping)); setSelected(null); setUsage({ input: 0, output: 0 });
            },
            error: error => toast.error(`Nie udało się odczytać pliku: ${error.message}`),
        });
    };

    const changeMapping = (field: keyof ColumnMapping, column: string) => {
        if (mapping[field] === column) return;
        if (field === 'sku') { setPhotos({}); setUnmatchedPhotos([]); }
        const next = { ...mapping, [field]: column };
        setMapping(next);
        setDrafts(previous => makeDrafts(rows, next).map((draft, i) => {
            if (field === 'price') return { ...previous[i], price: draft.price };
            return { ...draft, price: previous[i].price };
        }));
        setSelected(null);
    };
    const changeDraft = (index: number, patch: Partial<ImportDraft>) => {
        setDrafts(current => current.map((draft, i) => i === index ? { ...draft, ...patch } : draft));
    };


    const analyzeAll = async () => {
        if (!configured || !drafts.length) return;
        cancelled.current = false; setBusy(true);
        const groupByTemplate: Partial<Record<ImportTemplate, number>> = { pc: 47, monitor: 50, 'laptop-new': 9, ios: 16, android: 16 };
        const catalogs = new Map<number, string[]>();
        for (let index = 0; index < drafts.length; index++) {
            if (cancelled.current) break;
            try {
                const draft = drafts[index];
                const group = groupByTemplate[draft.template];
                if (group && !catalogs.has(group)) {
                    const attrs = new Map<number, string>();
                    for (let offset = 0; offset < 500; offset += 50) {
                        const { data } = await axios.get<{ list: Attribute[] }>(`${API_URL}/attributes`, { ...api, params: {
                            limit: 50, offset, filters: JSON.stringify({ attribute_group_id: group }),
                        } });
                        const before = attrs.size;
                        for (const attr of data.list) attrs.set(attr.attribute_id, attr.name);
                        if (attrs.size === before || data.list.length < 50) break;
                    }
                    catalogs.set(group, Array.from(new Set(attrs.values())));
                }
                if (cancelled.current) break;
                const { data } = await axios.post<AiResult>(`${API_URL}/bulk-ai/analyze`, {
                    row: draft.source, template: draft.template, attributeNames: group ? catalogs.get(group) : [],
                }, api);
                setDrafts(current => current.map((draft, i) => i === index ? {
                    ...draft, template: data.template, title: data.title, aiFields: data.fields, aiIssues: data.issues, confidence: data.confidence,
                } : draft));
                setUsage(current => ({ input: current.input + (data.usage?.inputTokens || 0), output: current.output + (data.usage?.outputTokens || 0) }));
            } catch (error) {
                const message = getApiErrorMessage(error, 'Analiza AI nie powiodła się.');
                setDrafts(current => current.map((draft, i) => i === index ? { ...draft, aiIssues: [message] } : draft));
                if (axios.isAxiosError(error) && error.response?.status === 429) {
                    toast.error(`Analiza zatrzymana na pozycji ${index + 1} z ${drafts.length}. ${message}`);
                    break;
                }
            }
        }
        setBusy(false);
    };

    const issuesByRow = useMemo(() => drafts.map((draft, index) => [
        ...validateDraft(draft, mapping, draft.issues.includes('Powtórzone SKU w pliku')),
        ...draft.aiIssues,
        ...(photos[index]?.length ? [] : ['Brak zdjęć produktu']),
    ]), [drafts, mapping, photos]);
    const counts = { problems: issuesByRow.filter(list => list.length).length };
    const current = selected === null ? null : drafts[selected];
    const currentIssues = selected === null ? [] : issuesByRow[selected] ?? [];

    if (!visible) return null;
    if (editing && current) return <ThemeProvider theme={importTheme}><Stack sx={{ maxWidth: 1200, mx: 'auto', p: 1 }} spacing={1}>
        <Stack direction="row" alignItems="center" gap={2}>
            <Button onClick={onBack}>Wróć do dostawy</Button>
            <Typography>{current.source[mapping.sku]} · {TEMPLATE_LABELS[current.template]} · {selected! + 1}/{drafts.length}</Typography>
        </Stack>
        {notice && <Alert severity="warning">{notice}</Alert>}
        {currentIssues.map((issue, index) => <Alert key={index} severity="warning">{issue}</Alert>)}
    </Stack></ThemeProvider>;

    return <ThemeProvider theme={importTheme}><Box sx={{ color: 'text.primary', bgcolor: 'background.default', maxWidth: 1200, mx: 'auto', px: 2, py: 3, textAlign: 'left' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1} sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Dostawa z CSV</Typography>
        </Stack>
        <AiSettingsPanel authToken={authToken} onConfigured={setConfigured} />

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
            <Button variant="outlined" disabled={busy} component="label">Wybierz plik CSV<input hidden disabled={busy} type="file" accept=".csv,text/csv" onChange={event => loadFile(event.target.files?.[0])} /></Button>
            <Typography variant="body2" color="text.secondary">{drafts.length ? `${drafts.length} produktów, ${counts.problems} wymagających uwagi` : 'Nie wybrano pliku'}</Typography>
            <Button variant="contained" disabled={!configured || !drafts.length || busy} onClick={analyzeAll}>Analizuj całą dostawę</Button>
            {!!drafts.length && <Button component="label" variant="outlined" title="Np. HPC131_1.jpg dla SKU HPC131">Dodaj zdjęcia według SKU
                <input hidden type="file" multiple accept="image/*" onChange={event => {
                    const { assigned, unmatched } = assignDeliveryPhotos(Array.from(event.target.files || []), drafts.map(d => d.source[mapping.sku] || ''));
                    setPhotos(previous => {
                        const next = { ...previous };
                        for (const [index, files] of Object.entries(assigned)) {
                            const merged = new Map([...previous[Number(index)] || [], ...files].map(file => [[file.name,file.size,file.lastModified].join(':'),file]));
                            next[Number(index)] = Array.from(merged.values());
                        }
                        return next;
                    });
                    setUnmatchedPhotos(unmatched); event.target.value = '';
                }} />
            </Button>}
            {busy && <Button color="warning" onClick={() => { cancelled.current = true; }}>Zatrzymaj po bieżącym</Button>}
        </Stack>
        {usage.input + usage.output > 0 && <Typography variant="caption" color="text.secondary">Zużycie AI: {usage.input} tokenów wejścia, {usage.output} wyjścia</Typography>}
        {!!unmatchedPhotos.length && <Alert severity="warning">Zdjęcia bez jednoznacznego SKU: {unmatchedPhotos.join(', ')}</Alert>}
        {!!headers.length && <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ my: 2 }}>
            {(Object.keys(mapping) as (keyof ColumnMapping)[]).map(field => <TextField key={field} disabled={busy} select size="small" label={{ sku: 'SKU', manufacturer: 'Producent', model: 'Model', price: 'Cena', condition: 'Stan' }[field]} value={mapping[field]} onChange={event => changeMapping(field, event.target.value)} sx={{ minWidth: 150, flex: 1 }}>
                <MenuItem value="">Brak</MenuItem>{headers.map(header => <MenuItem key={header} value={header}>{header}</MenuItem>)}
            </TextField>)}
        </Stack>}
        {!!drafts.length && <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>SKU</TableCell><TableCell>Produkt</TableCell><TableCell>Szablon</TableCell><TableCell>Cena (zł)</TableCell><TableCell>Zdjęcia</TableCell><TableCell>Kontrola</TableCell><TableCell /></TableRow></TableHead><TableBody>
            {drafts.map((draft, index) => { const problems = issuesByRow[index]; return <TableRow key={index} hover><TableCell>{draft.source[mapping.sku] || '—'}</TableCell><TableCell>{draft.title || draft.source[mapping.model] || '—'}</TableCell><TableCell>{TEMPLATE_LABELS[draft.template]}</TableCell><TableCell><TextField size="small" value={draft.price} inputProps={{ inputMode: "decimal", "aria-label": "Cena: " + draft.source[mapping.sku] }} sx={{ minWidth: 85, maxWidth: 115 }} onChange={e => changeDraft(index, { price: e.target.value })} /></TableCell><TableCell>{photos[index]?.length ?? 0}</TableCell><TableCell><Chip size="small" color={problems.length ? 'warning' : 'success'} label={problems.length ? `Uwagi: ${problems.length}` : 'Do weryfikacji'} /></TableCell><TableCell><Button size="small" onClick={() => setSelected(index)}>Otwórz</Button></TableCell></TableRow>; })}
        </TableBody></Table></Paper>}
        {current && <Paper variant="outlined" sx={{ p: 2, mt: 2 }}><Stack direction="row" justifyContent="space-between"><Typography variant="h6">{current.source[mapping.sku] || 'Produkt bez SKU'}</Typography><Button onClick={() => setSelected(null)}>Zamknij</Button></Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} sx={{ my: 2 }}><TextField select size="small" label="Szablon" value={current.template} onChange={event => changeDraft(selected!, { template: event.target.value as ImportTemplate })} sx={{ minWidth: 230 }}>{Object.entries(TEMPLATE_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField size="small" label="Tytuł" value={current.title} onChange={event => changeDraft(selected!, { title: event.target.value })} fullWidth /><TextField size="small" label="Cena" value={current.price} onChange={event => changeDraft(selected!, { price: event.target.value })} sx={{ width: 150 }} /></Stack>
            {currentIssues.map((issue, index) => <Alert key={index} severity="warning" sx={{ mb: 1 }}>{issue}</Alert>)}
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Button variant="outlined" component="label">Wybierz zdjęcia
                    <input type="file" multiple hidden accept="image/*" onChange={event => {
                        const files = Array.from(event.target.files || []);
                        if (files.length) setPhotos(previous => ({ ...previous, [selected!]: files }));
                    }} />
                </Button>
                <Typography variant="body2">{(photos[selected!] || []).map(file => file.name).join(', ')}</Typography>
                <Button variant="contained" disabled={busy || current.template === 'unknown'} onClick={() => onOpen({
                    draft: current, mapping, photos: photos[selected!] || [],
                })}>Uzupełnij formularz</Button>
            </Stack>
            {!!current.aiFields.length && <Box sx={{ mt: 2 }}><Typography variant="subtitle2">Pola odczytane przez AI</Typography>{current.aiFields.map((field, index) => <Typography key={index} variant="body2"><strong>{field.name}:</strong> {field.value}</Typography>)}</Box>}
            <Box component="details" sx={{ mt: 2 }}><Box component="summary" sx={{ cursor: 'pointer' }}>Wiersz źródłowy</Box><Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>{JSON.stringify(current.source, null, 2)}</Box></Box>
        </Paper>}
    </Box></ThemeProvider>;
}
