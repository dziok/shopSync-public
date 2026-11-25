import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import type { Attribute } from './types';
import { descriptionAttributes } from './descriptionAttributes';
import { Autocomplete, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import catalog from 'virtual:listing-copy';
import { getTemplateDescriptionCatalog, type CopyEntry } from './templateDescriptionCatalog';
import type { Language, TemplateKey } from './templateSettings';
import { editableOptionHtml, legacyPartKeys } from './templateCopy';
import OfficeRowEditor from './officeRowEditor';
import { officeRowDefault } from './addProduct/officeSpecRows';
const filterOptions = createFilterOptions<CopyEntry>({ stringify: e => e.label + ' ' + e.original });

export default function TemplateCopyEditor({ authToken, template, language, edits, onChange }: {
    authToken: string;
    template: TemplateKey; language: Language; edits: Record<string,string>; onChange: (edits: Record<string,string>) => void;
}) {
    const entries = useMemo(() => [...getTemplateDescriptionCatalog(template), ...(catalog[template] ?? [])]
        .filter(e => e.language === language), [template,language]);
    const groups = [...new Set(entries.map(e => e.group))];
    const [group,setGroup] = useState(groups[0] ?? '');
    const [loaded, setLoaded] = useState<{ id: string; labels: string[] }>();
    const [failed, setFailed] = useState('');
    const [reload, setReload] = useState(0);
    const attributeId = descriptionAttributes[template]?.[group];
    useEffect(() => {
        if (!attributeId) return;
        const controller = new AbortController();
        setFailed('');
        axios.get<{ list: Attribute[] }>(API_URL + '/attributes', {
            headers: { Authorization: 'Bearer ' + authToken }, signal: controller.signal,
            params: { filters: JSON.stringify({ attribute_id: attributeId }), limit: 50, page: 1 },
        }).then(({ data }) => {
            const attr = data.list.find(a => String(a.attribute_id) === attributeId);
            if (!Array.isArray(attr?.options)) throw new Error('Brak opcji atrybutu');
            const labels = attr.options.map(o => template === 'pc' && group === 'Procesor' ? o.value.trim().replace(/\s+/g, ' ') : o.value).filter(Boolean);
            if (!controller.signal.aborted) setLoaded({ id: attributeId, labels });
        }).catch(() => { if (!controller.signal.aborted) setFailed(attributeId); });
        return () => controller.abort();
    }, [attributeId, template, group, authToken, reload]);
    const options = entries.filter(e => e.group === group);
    if (attributeId) {
        const prefix = language + ':' + group + ':';
        const identity = (s: string) => template === 'pc' && group === 'Procesor' ? s.toLowerCase() : s;
        const known = new Set(options.map(e => identity(e.label)));
        for (const label of [...(loaded?.id === attributeId ? loaded.labels : []), ...Object.keys(edits).filter(k => k.startsWith(prefix) && !k.includes(':część:')).map(k => k.slice(prefix.length))]) {
            if (known.has(identity(label))) continue;
            known.add(identity(label));
            options.push({ id: prefix + label, label, language, group, original: '' });
        }
    }
    const [selected,select] = useState('');
    const entry = options.find(e => e.id === selected) ?? options[0];
    if (!entry) return <Typography variant="body2">Brak wbudowanych opisów w tym języku.</Typography>;
    const inherited = (e: CopyEntry) => e.row ? officeRowDefault(e.row, id => edits[id]) : e.original;
    const modified = (item: CopyEntry) => item.row ? (edits[item.id] ?? inherited(item)) !== item.original :
        edits[item.id] !== undefined || (item.html && legacyPartKeys(edits, item.id).length > 0);
    const value = entry.html ? editableOptionHtml(entry.original, entry.id, edits) : edits[entry.id] ?? inherited(entry);
    function change(value?: string) {
        const next = { ...edits };
        if (entry.html) for (const key of legacyPartKeys(next, entry.id)) delete next[key];
        if (entry.row && (value === undefined || value === entry.original) && inherited(entry) !== entry.original) next[entry.id] = entry.original;
        else if (value === undefined || value === entry.original) delete next[entry.id];
        else next[entry.id] = value;
        onChange(next);
    }
    return <Stack spacing={1.5}>
        <h3>Treść szablonu</h3>
        <div className="template-admin__fields">
            <TextField select size="small" label="Grupa opisów" value={group} onChange={e => {setGroup(e.target.value); select('');}}>
                {groups.map(g => <MenuItem key={g} value={g}>
                    {g}{descriptionAttributes[template]?.[g] && <Chip component="span" size="small" variant="outlined"
                        label="Opcje z Shopera" sx={{ ml: 1, height: 20, fontSize: 11, verticalAlign: 'middle' }} />}
                </MenuItem>)}
            </TextField>
            <Autocomplete options={options} filterOptions={filterOptions} value={entry} disableClearable getOptionKey={e => e.id}
                getOptionLabel={e => e.label} onChange={(_, e) => select(e.id)}
                renderOption={(props,e) => <li {...props} key={e.id}>{e.label}{modified(e) ? ' (zmieniony)' : ''}</li>}
                renderInput={params => <TextField {...params} label={entry.row ? 'Wiersz opisu' : 'Opcja lub fragment opisu'} size="small" />} />
        </div>
        {attributeId && failed === attributeId && <Typography variant="body2" color="warning.main">
            Nie udało się pobrać opcji z Shopera. Wbudowane i zapisane opisy są nadal dostępne.
            <Button size="small" onClick={() => setReload(n => n + 1)}>Ponów</Button>
        </Typography>}
        {entry.row ? <OfficeRowEditor key={entry.id} row={entry.row} value={value} onChange={change} /> :
        <TextField label={entry.html ? 'Kod HTML opisu' : 'Treść opisu'} value={value} multiline minRows={entry.html ? 10 : 3} maxRows={22} fullWidth
            helperText={entry.html ? 'Formatowanie, listy, klasy i zdjęcia są obsługiwane. Skrypty, zdarzenia i style inline są pomijane w zmienionym HTML.' : undefined}
            inputProps={{maxLength:12000, ...(entry.html && { spellCheck: false, style: { fontFamily: 'monospace' } })}} onChange={e => change(e.target.value)} />}
        {modified(entry) && <div>
            <details><summary>Tekst domyślny</summary><Typography sx={{ whiteSpace: 'pre-wrap' }}>{entry.original || '(pusty)'}</Typography></details>
            <Button onClick={() => change()}>Przywróć domyślny opis</Button>
        </div>}
    </Stack>;
}
