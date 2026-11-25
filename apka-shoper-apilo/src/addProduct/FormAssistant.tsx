import { useEffect, useRef, useState } from 'react';
import { useWatch, type Control, type FieldValues } from 'react-hook-form';
import axios from 'axios';
import {
    Alert,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Sparkles } from 'lucide-react';
import { API_URL } from '../config';
import { getApiErrorMessage } from '../backendQueries/apiErrorMessage';
import type { Attribute } from '../types';
import type { CatalogField } from '../allegroParameters/catalog';
import { formFields, validateSuggestion, type AiField, type AiValue } from './formAiFields';

type Props<T extends FieldValues> = {
    template: string;
    token: string;
    control: Control<T>;
    attributes?: Attribute[];
    attributesPending?: boolean;
    attributesError?: string;
    read: (key: string) => unknown;
    write: (key: string, value: AiValue) => void;
    knownFalse: (key: string) => boolean;
    allegro?: {
        catalog: CatalogField[];
        values: Record<string, unknown>;
        write: (key: string, value: string | string[]) => void;
        locked: (key: string) => boolean;
    };
};
type Change = { field: AiField; before: unknown; values: string[]; value: AiValue; chosen: boolean };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const display = (v: unknown) =>
    v === true ? 'Tak' : v === false ? 'Nie' : Array.isArray(v) ? v.join(', ') : String(v ?? '');
export default function FormAssistant<T extends FieldValues>({
    template,
    token,
    attributes = [],
    attributesPending = false,
    attributesError,
    control,
    read,
    write,
    knownFalse,
    allegro,
}: Props<T>) {
    const [open, setOpen] = useState(false),
        [mode, setMode] = useState('text-shoper'),
        [instruction, setInstruction] = useState('');
    const [changes, setChanges] = useState<Change[]>([]),
        [messages, setMessages] = useState<string[]>([]),
        [busy, setBusy] = useState(false);
    const [marks, setMarks] = useState<Change[]>([]);
    const controller = useRef<AbortController>();
    const analyzedSource = useRef('');
    useEffect(() => () => controller.current?.abort(), []);
    const valueOf = (f: AiField) => (f.id.startsWith('a:') ? allegro?.values[f.key] : read(f.key));
    useWatch({ control, disabled: !marks.length });
    const visibleMarks = marks.filter((c) => equal(valueOf(c.field), c.value));
    useEffect(() => {
        if (visibleMarks.length !== marks.length) setMarks(visibleMarks);
    });
    const reset = () => {
        setChanges([]);
        setMessages([]);
    };
    const close = () => {
        controller.current?.abort();
        setBusy(false);
        setOpen(false);
        reset();
    };
    const fields = () => formFields(template, attributes, allegro?.catalog ?? [], allegro?.locked);
    const sourceFacts = (all: AiField[]) =>
        mode.startsWith('text')
            ? []
            : all
                  .filter(
                      (f) =>
                          f.id.startsWith(mode === 'allegro-shoper' ? 'a:' : 's:') ||
                          (template === 'gaming' && mode === 'shoper-allegro'),
                  )
                  .flatMap((f) => {
                      const v = valueOf(f);
                      return (v === false && !knownFalse(f.key)) || !display(v).trim()
                          ? []
                          : [{ label: f.label, value: display(v).slice(0, 2000) }];
                  });
    const analyze = async () => {
        reset();
        const all = fields(),
            toAllegro = mode.endsWith('-allegro');
        const source = sourceFacts(all);
        analyzedSource.current = JSON.stringify(source);
        if (!mode.startsWith('text') && !source.length) {
            setMessages(['Formularz źródłowy nie zawiera danych do przeniesienia.']);
            return;
        }
        const targets = all.filter(
            (f) =>
                !f.locked &&
                (mode === 'text-both' || f.id.startsWith(toAllegro ? 'a:' : 's:') || (template === 'gaming' && mode === 'text-shoper')),
        );
        const before = new Map(targets.map((f) => [f.id, valueOf(f)]));
        const context = (instruction + ' ' + source.map((s) => s.value).join(' ')).toLocaleLowerCase('pl');
        const request = new AbortController();
        controller.current = request;
        setBusy(true);
        try {
            const { data } = await axios.post(
                `${API_URL}/bulk-ai/form`,
                {
                    template,
                    mode,
                    instruction,
                    source,
                    fields: targets.map((f) => ({
                        id: f.id,
                        label: f.label,
                        kind: f.kind,
                        current:
                            before.get(f.id) === false && !knownFalse(f.key)
                                ? undefined
                                : display(before.get(f.id)).slice(0, 1000) || undefined,
                        options:
                            f.choices &&
                            (f.choices.length <= 60
                                ? f.choices
                                : [
                                      ...new Set([
                                          ...f.choices.filter((s) => context.includes(s.toLowerCase())),
                                          ...f.choices.slice(0, 20),
                                      ]),
                                  ].slice(0, 60)),
                    })),
                },
                { headers: { Authorization: `Bearer ${token}` }, signal: request.signal },
            );
            if (request.signal.aborted) return;
            const warnings: string[] = [...data.warnings],
                next: Change[] = [];
            for (const change of data.changes) {
                const f = targets.find((f) => f.id === change.id);
                if (!f) continue;
                const value = validateSuggestion(f, change.values);
                if (value === undefined) {
                    warnings.push(`${f.label}: odrzucono niedozwoloną wartość „${display(change.values)}”.`);
                    continue;
                }
                if (!equal(value, before.get(f.id)))
                    next.push({ field: f, before: before.get(f.id), values: change.values, value, chosen: true });
            }
            if (!next.length) warnings.push('Brak zmian do zastosowania.');
            setChanges(next);
            setMessages(warnings);
        } catch (error) {
            if (!request.signal.aborted)
                setMessages([getApiErrorMessage(error, 'Analiza nie powiodła się. Formularz nie został zmieniony.')]);
        } finally {
            if (!request.signal.aborted) setBusy(false);
        }
    };
    const apply = () => {
        const all = fields(),
            applied: Change[] = [],
            skipped: string[] = [];
        if (JSON.stringify(sourceFacts(all)) !== analyzedSource.current) {
            setChanges([]);
            setMessages(['Dane źródłowe zmieniły się po analizie. Pobierz nowe propozycje.']);
            return;
        }
        for (const c of changes.filter((c) => c.chosen)) {
            const f = all.find((f) => f.id === c.field.id);
            if (
                !f ||
                f.key !== c.field.key ||
                !equal(valueOf(f), c.before) ||
                !equal(validateSuggestion(f, c.values), c.value)
            ) {
                skipped.push(c.field.label);
                continue;
            }
            if (f.id.startsWith('a:')) allegro!.write(f.key, c.value as string | string[]);
            else write(f.key, c.value);
            applied.push(c);
        }
        setMarks((old) => [...old.filter((o) => !applied.some((c) => c.field.id === o.field.id)), ...applied]);
        if (skipped.length) {
            setChanges([]);
            setMessages(['Pominięto pola zmienione od czasu analizy: ' + skipped.join(', ')]);
        } else close();
    };
    const selectors = visibleMarks.map(({ field: f }) =>
        f.id.startsWith('a:')
            ? `[data-ai-allegro="${CSS.escape(f.id.slice(2))}"]`
            : `:is(.MuiInputBase-root,.MuiFormControlLabel-root):has([name="${CSS.escape(f.key)}"])`,
    );
    return (
        <>
            {selectors.length > 0 && <style>{selectors.join(',') + ' { box-shadow: inset 3px 0 #aa8df3; }'}</style>}
            <Button type="button" variant="outlined" startIcon={<Sparkles size={15} />} onClick={() => setOpen(true)}>
                Asystent AI{visibleMarks.length ? ` (${visibleMarks.length})` : ''}
            </Button>
            <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="ai-dialog-title">
                <DialogTitle id="ai-dialog-title">Asystent formularza</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {visibleMarks.length > 0 && <details>
                            <summary>Pola uzupełnione przez AI ({visibleMarks.length})</summary>
                            <ul>{visibleMarks.map(({field,value}) => <li key={field.id}>
                                {field.id.startsWith('a:') ? 'Allegro' : 'Shoper'} · {field.label}: {display(value)}
                            </li>)}</ul>
                        </details>}
                        <TextField
                            select
                            label="Tryb"
                            value={mode}
                            disabled={busy}
                            onChange={(e) => {
                                setMode(e.target.value);
                                reset();
                            }}
                        >
                            <MenuItem value="text-shoper">
                                Polecenie → {template === 'gaming' ? 'dane produktu' : 'Shoper'}
                            </MenuItem>
                            {allegro &&
                                <MenuItem value="text-both">Polecenie → oba formularze</MenuItem>}
                            {allegro &&
                                ['text-allegro', 'allegro-shoper', 'shoper-allegro'].map((m, i) => (
                                    <MenuItem value={m} key={m}>
                                        {['Polecenie → Allegro', 'Allegro → Shoper', 'Shoper → Allegro'][i]}
                                    </MenuItem>
                                ))}
                        </TextField>
                        {template === 'gaming' && (
                            <Typography variant="caption">
                                Specyfikacja podzespołów jest wspólna dla Shopera i Allegro.
                            </Typography>
                        )}
                        <TextField
                            multiline
                            minRows={4}
                            label="Polecenie, specyfikacja lub audyt"
                            value={instruction}
                            disabled={busy}
                            inputProps={{ maxLength: 12000 }}
                            onChange={(e) => {
                                setInstruction(e.target.value);
                                reset();
                            }}
                        />
                        <Typography variant="caption">
                            Do OpenAI zostaną wysłane polecenie i dane produktu z wybranych formularzy. Usuń z audytu
                            dane osobowe i hasła. Fioletowa kreska oznacza wartości wprowadzone przez AI.
                        </Typography>
                        {attributesPending ? <Typography variant="caption">Pobieranie pól Shopera…</Typography> :
                            attributesError && <Alert severity="warning">Nie pobrano atrybutów Shopera. {attributesError}</Alert>}
                        <Button disabled={busy || attributesPending || !!attributesError || (mode.startsWith('text') && !instruction.trim())} onClick={analyze}>
                            {busy ? 'Analizowanie…' : 'Zaproponuj zmiany'}
                        </Button>
                        {messages.map((m, i) => (
                            <Alert severity="info" key={i}>
                                {m}
                            </Alert>
                        ))}
                        {changes.map((c) => (
                            <label key={c.field.id}>
                                <Checkbox
                                    checked={c.chosen}
                                    onChange={(_, chosen) =>
                                        setChanges((prev) =>
                                            prev.map((item) => (item === c ? { ...item, chosen } : item)),
                                        )
                                    }
                                />
                                <strong>{mode === 'text-both' && (c.field.id.startsWith('a:') ? 'Allegro · ' : 'Shoper · ')}{c.field.label}</strong>: {display(c.before) || 'Puste'} → {display(c.value)}
                            </label>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={close}>Zamknij</Button>
                    <Button variant="contained" disabled={attributesPending || !!attributesError || !changes.some((c) => c.chosen)} onClick={apply}>
                        Zastosuj wybrane
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
