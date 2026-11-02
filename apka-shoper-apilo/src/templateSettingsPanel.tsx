import { useEffect, useState } from "react";
import axios from "axios";
import { Autocomplete, Button, MenuItem, Tab, Tabs, TextField, ThemeProvider } from "@mui/material";
import { toast } from "react-toastify";
import { API_URL } from "./config";
import { getApiErrorMessage } from "./backendQueries/apiErrorMessage";
import {
    ACTIVE_TEMPLATE_KEYS, BlockRule, DescriptionRule, Language, LocalizedText, TemplateKey, TEMPLATE_NAMES,
    TemplateSettings, TemplateSettingsFile, TextReplacement,
} from "./templateSettings";
import "./templateSettingsPanel.css";
import { MainTheme } from "./addProduct/themes";
import { CatalogEntry, getTemplateDescriptionCatalog } from "./templateDescriptionCatalog";
import { getTemplateBlockCatalog } from "./templateBlocks";

type Props = {
    authToken: string;
    initialKey: TemplateKey;
    settings: TemplateSettingsFile;
    onSaved: (settings: TemplateSettingsFile) => void;
    onClose: () => void;
};

const emptyText = (): LocalizedText => ({ pl: "", cz: "", sk: "" });
const copy = (value: TemplateSettings): TemplateSettings => JSON.parse(JSON.stringify(value));
const nextId = () => window.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const languageLabels: Record<Language, string> = { pl: "Polski", cz: "Czeski", sk: "Słowacki" };
const fieldLabels: Record<DescriptionRule["field"], string> = {
    always: "Zawsze", attribute: "Atrybut Shopera", category: "Kategoria Shopera",
    name: "Nazwa produktu", sku: "SKU",
};

export default function TemplateSettingsPanel({ authToken, initialKey, settings, onSaved, onClose }: Props) {
    const [key, setKey] = useState<TemplateKey>(initialKey);
    const [draft, setDraft] = useState<TemplateSettings>(() => copy(settings.templates[initialKey]));
    const [tab, setTab] = useState(0);
    const [language, setLanguage] = useState<Language>("pl");
    const [saving, setSaving] = useState(false);
    const [serverVersion, setServerVersion] = useState<TemplateSettingsFile | null>(null);
    const dirty = JSON.stringify(draft) !== JSON.stringify(settings.templates[key]);
    const catalog = getTemplateDescriptionCatalog(key);
    const blocks = getTemplateBlockCatalog(key);

    useEffect(() => { setDraft(copy(settings.templates[key])); }, [settings, key]);

    const switchTemplate = (next: TemplateKey) => {
        if (saving || next === key) return;
        if (dirty && !window.confirm("Odrzucić niezapisane zmiany?")) return;
        setKey(next);
        setTab(0);
        setServerVersion(null);
    };
    const close = () => {
        if (saving) return;
        if (dirty && !window.confirm("Odrzucić niezapisane zmiany?")) return;
        onClose();
    };
    const updateNumber = (field: keyof TemplateSettings["shoper"], value: string) => {
        setDraft((current) => ({
            ...current, shoper: { ...current.shoper, [field]: value === "" ? null : Number(value) },
        }));
    };
    const updateLocalized = (section: "before" | "after", value: string) => {
        setDraft((current) => ({
            ...current, description: {
                ...current.description,
                [section]: { ...current.description[section], [language]: value },
            },
        }));
    };
    const updateRule = (id: string, patch: Partial<DescriptionRule>) => {
        setDraft((current) => ({ ...current, description: {
            ...current.description, rules: current.description.rules.map((rule) =>
                rule.id === id ? { ...rule, ...patch } : rule),
        } }));
    };
    const updateReplacement = (id: string, patch: Partial<TextReplacement>) => {
        setDraft((current) => ({ ...current, description: {
            ...current.description, replacements: current.description.replacements.map((item) =>
                item.id === id ? { ...item, ...patch } : item),
        } }));
    };
    const updateBlock = (id: string, patch: Partial<BlockRule> | { mode: "default" }) => {
        setDraft((current) => {
            const next = { ...current.description.blocks };
            if (patch.mode === "default") delete next[id];
            else next[id] = { ...(next[id] ?? { mode: "hide", field: "attribute", attributeId: "", match: "equals", value: "" }), ...patch } as BlockRule;
            return { ...current, description: { ...current.description, blocks: next } };
        });
    };
    const save = async () => {
        for (const rule of Object.values(draft.description.blocks)) {
            if (rule.mode !== "hide" && (!rule.value.trim() || (rule.field === "attribute" && !/^\d+$/.test(rule.attributeId)))) {
                toast.error("Uzupełnij warunek widoczności sekcji przed zapisem.");
                return;
            }
        }
        setSaving(true);
        try {
            const response = await axios.put<TemplateSettingsFile>(
                `${API_URL}/template-settings/${key}`, draft,
                { headers: { Authorization: `Bearer ${authToken}`, "If-Match": String(settings.revision) } },
            );
            onSaved(response.data);
            setServerVersion(null);
            toast.success(`Zapisano ustawienia: ${TEMPLATE_NAMES[key]}.`);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setServerVersion(error.response.data?.settings ?? null);
                toast.error("Ustawienia zmieniły się na serwerze. Wczytaj aktualną wersję przed zapisem.");
            } else {
                toast.error(getApiErrorMessage(error, "Nie udało się zapisać ustawień szablonu."));
            }
        } finally {
            setSaving(false);
        }
    };
    const reload = () => {
        if (!serverVersion) return;
        onSaved(serverVersion);
        setDraft(copy(serverVersion.templates[key]));
        setServerVersion(null);
    };
    const addCatalogDescription = (entry: CatalogEntry | null) => {
        if (!entry) return;
        if (draft.description.replacements.some((item) => item.label === entry.label)) {
            toast.info("Ten opis jest już dodany do edycji.");
            return;
        }
        setDraft((current) => ({ ...current, description: {
            ...current.description,
            replacements: [...current.description.replacements, {
                id: nextId(), label: entry.label, find: { ...entry.text }, text: { ...entry.text },
            }],
        } }));
    };

    return <ThemeProvider theme={MainTheme}><div className="template-admin">
        <header className="template-admin__header">
            <div><h2>Ustawienia szablonów</h2><span>{TEMPLATE_NAMES[key]}</span></div>
            <div className="template-admin__actions">
                {serverVersion && <Button variant="outlined" color="warning" onClick={reload}>Wczytaj aktualne</Button>}
                <Button variant="contained" disabled={!dirty || saving || !!serverVersion} onClick={save}>
                    {saving ? "Zapisywanie…" : "Zapisz zmiany"}
                </Button>
                <Button variant="text" disabled={saving} onClick={close}>Zamknij</Button>
            </div>
        </header>
        <div className="template-admin__layout">
            <nav className="template-admin__templates" aria-label="Szablony">
                {(Object.entries(TEMPLATE_NAMES) as Array<[TemplateKey, string]>).filter(([id]) => ACTIVE_TEMPLATE_KEYS.includes(id)).map(([id, name]) =>
                    <button key={id} type="button" disabled={saving} className={key === id ? "selected" : ""}
                        onClick={() => switchTemplate(id)}>{name}</button>
                )}
            </nav>
            <main className="template-admin__main">
                <Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable" scrollButtons="auto">
                    <Tab label="Shoper" /><Tab label="Opisy" /><Tab label="Elementy opisu" /><Tab label="Apilo" /><Tab label="Allegro" />
                </Tabs>
                {tab === 0 && <div className="template-admin__fields">
                    {([
                        ["categoryId", "ID kategorii"], ["gaugeId", "ID jednostki miary"],
                        ["deliveryId", "ID czasu wysyłki"], ["gfxId", "ID grafiki"],
                    ] as const).map(([field, label]) => <TextField key={field} type="number" label={label}
                        value={draft.shoper[field] ?? ""} onChange={(event) => updateNumber(field, event.target.value)}
                        inputProps={{ min: 0, step: 1 }} fullWidth />)}
                    <TextField label="PKWiU" value={draft.shoper.pkwiu} fullWidth
                        onChange={(event) => setDraft((current) => ({ ...current, shoper: { ...current.shoper, pkwiu: event.target.value } }))} />
                </div>}
                {tab === 1 && <div className="template-admin__descriptions">
                    <Tabs value={language} onChange={(_, next: Language) => setLanguage(next)}>
                        {(Object.entries(languageLabels) as Array<[Language, string]>).map(([id, label]) => <Tab key={id} value={id} label={label} />)}
                    </Tabs>
                    <div className="template-admin__fields">
                        <TextField label="Tekst przed opisem" multiline minRows={3} fullWidth
                            value={draft.description.before[language]} onChange={(event) => updateLocalized("before", event.target.value)} />
                        <TextField label="Tekst po opisie" multiline minRows={3} fullWidth
                            value={draft.description.after[language]} onChange={(event) => updateLocalized("after", event.target.value)} />
                    </div>
                    <div className="template-admin__section-title"><h3>Opisy zależne od opcji</h3>
                        <Button onClick={() => setDraft((current) => ({ ...current, description: {
                            ...current.description, rules: [...current.description.rules, {
                                id: nextId(), placement: "after", field: "attribute", attributeId: "", match: "equals", value: "", text: emptyText(),
                            }],
                        } }))}>Dodaj opis</Button></div>
                    {draft.description.rules.map((rule, index) => <div className="template-admin__entry" key={rule.id}>
                        <div className="template-admin__entry-head"><strong>Reguła {index + 1}</strong>
                            <Button color="error" size="small" onClick={() => setDraft((current) => ({ ...current, description: {
                                ...current.description, rules: current.description.rules.filter((item) => item.id !== rule.id),
                            } }))}>Usuń</Button></div>
                        <div className="template-admin__rule-fields">
                            <TextField select label="Położenie" value={rule.placement ?? "after"}
                                onChange={(event) => updateRule(rule.id, { placement: event.target.value as DescriptionRule["placement"] })}>
                                <MenuItem value="before">Przed opisem</MenuItem><MenuItem value="after">Po opisie</MenuItem>
                            </TextField>
                            <TextField select label="Warunek" value={rule.field} onChange={(event) => updateRule(rule.id, { field: event.target.value as DescriptionRule["field"] })}>
                                {(Object.entries(fieldLabels) as Array<[DescriptionRule["field"], string]>).map(([id, label]) =>
                                    <MenuItem key={id} value={id}>{label}</MenuItem>)}</TextField>
                            {rule.field === "attribute" && <TextField label="ID atrybutu" value={rule.attributeId}
                                onChange={(event) => updateRule(rule.id, { attributeId: event.target.value })} />}
                            {rule.field !== "always" && <><TextField select label="Dopasowanie" value={rule.match}
                                onChange={(event) => updateRule(rule.id, { match: event.target.value as DescriptionRule["match"] })}>
                                <MenuItem value="equals">Równa się</MenuItem><MenuItem value="contains">Zawiera</MenuItem>
                            </TextField><TextField label="Wartość" value={rule.value}
                                onChange={(event) => updateRule(rule.id, { value: event.target.value })} /></>}
                        </div>
                        <TextField label={`Opis: ${languageLabels[language]}`} multiline minRows={3} fullWidth
                            value={rule.text[language]} onChange={(event) => updateRule(rule.id, { text: { ...rule.text, [language]: event.target.value } })} />
                    </div>)}
                    {catalog.length > 0 && <div className="template-admin__catalog">
                        <Autocomplete<CatalogEntry> options={catalog} value={null} onChange={(_, entry) => addCatalogDescription(entry)}
                            getOptionLabel={(entry) => entry.label} groupBy={(entry) => entry.label.split(":")[0]}
                            renderInput={(params) => <TextField {...params} label="Dodaj istniejący opis opcji" />}
                        />
                    </div>}
                    <div className="template-admin__section-title"><h3>Zamiany tekstu</h3>
                        <Button onClick={() => setDraft((current) => ({ ...current, description: {
                            ...current.description, replacements: [...current.description.replacements, { id: nextId(), find: emptyText(), text: emptyText() }],
                        } }))}>Dodaj zamianę</Button></div>
                    {draft.description.replacements.map((item, index) => <div className="template-admin__entry" key={item.id}>
                        <div className="template-admin__entry-head"><strong>{item.label || `Zamiana ${index + 1}`}</strong>
                            <Button color="error" size="small" onClick={() => setDraft((current) => ({ ...current, description: {
                                ...current.description, replacements: current.description.replacements.filter((entry) => entry.id !== item.id),
                            } }))}>Usuń</Button></div>
                        <div className="template-admin__fields">
                            <TextField label={`Oryginalny tekst: ${languageLabels[language]}`} value={item.find[language]} multiline minRows={2} fullWidth
                                onChange={(event) => updateReplacement(item.id, { find: { ...item.find, [language]: event.target.value } })} />
                            <TextField label={`Nowy tekst: ${languageLabels[language]}`} value={item.text[language]} multiline minRows={2} fullWidth
                                onChange={(event) => updateReplacement(item.id, { text: { ...item.text, [language]: event.target.value } })} />
                        </div>
                    </div>)}
                </div>}
                {tab === 2 && <div className="template-admin__blocks">
                    {blocks.length === 0 ? <p>Ten szablon nie ma gotowych sekcji opisu.</p> : blocks.map((block) => {
                        const rule = draft.description.blocks[block.id];
                        return <div className="template-admin__entry" key={block.id}>
                            <div className="template-admin__block-head">
                                <strong>{block.label}</strong>
                                <TextField select size="small" label="Widoczność" value={rule?.mode ?? "default"}
                                    onChange={(event) => updateBlock(block.id, { mode: event.target.value as BlockRule["mode"] | "default" })}>
                                    <MenuItem value="default">Według szablonu</MenuItem>
                                    <MenuItem value="hide">Zawsze ukryj</MenuItem>
                                    <MenuItem value="show-when">Zachowaj tylko, gdy</MenuItem>
                                    <MenuItem value="hide-when">Ukryj, gdy</MenuItem>
                                </TextField>
                            </div>
                            {rule && rule.mode !== "hide" && <div className="template-admin__rule-fields">
                                <TextField select label="Pole" value={rule.field}
                                    onChange={(event) => updateBlock(block.id, { field: event.target.value as BlockRule["field"] })}>
                                    {(Object.entries(fieldLabels) as Array<[DescriptionRule["field"], string]>)
                                        .filter(([id]) => id !== "always").map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
                                </TextField>
                                {rule.field === "attribute" && <TextField label="ID atrybutu" value={rule.attributeId}
                                    onChange={(event) => updateBlock(block.id, { attributeId: event.target.value })} />}
                                <TextField select label="Dopasowanie" value={rule.match}
                                    onChange={(event) => updateBlock(block.id, { match: event.target.value as BlockRule["match"] })}>
                                    <MenuItem value="equals">Równa się</MenuItem><MenuItem value="contains">Zawiera</MenuItem>
                                </TextField>
                                <TextField label="Wartość" value={rule.value}
                                    onChange={(event) => updateBlock(block.id, { value: event.target.value })} />
                            </div>}
                        </div>;
                    })}
                </div>}
                {tab === 3 && <div className="template-admin__fields">
                    <TextField type="number" label="Podatek VAT (%)" value={draft.apilo.tax ?? ""} inputProps={{ min: 0, max: 100 }}
                        onChange={(event) => setDraft((current) => ({ ...current, apilo: { ...current.apilo, tax: event.target.value === "" ? null : Number(event.target.value) } }))} />
                    <TextField type="number" label="Status produktu" value={draft.apilo.status ?? ""} inputProps={{ min: 0, max: 10 }}
                        onChange={(event) => setDraft((current) => ({ ...current, apilo: { ...current.apilo, status: event.target.value === "" ? null : Number(event.target.value) } }))} />
                </div>}
                {tab === 4 && <div className="template-admin__fields">
                    <TextField label="Cennik dostawy" value={draft.allegro.shippingRatesName} fullWidth
                        onChange={(event) => setDraft((current) => ({ ...current, allegro: { ...current.allegro, shippingRatesName: event.target.value } }))} />
                    <TextField label="Polityka zwrotów" value={draft.allegro.returnPolicyName} fullWidth
                        onChange={(event) => setDraft((current) => ({ ...current, allegro: { ...current.allegro, returnPolicyName: event.target.value } }))} />
                    <TextField label="Gwarancja" value={draft.allegro.warrantyName} fullWidth
                        onChange={(event) => setDraft((current) => ({ ...current, allegro: { ...current.allegro, warrantyName: event.target.value } }))} />
                </div>}
            </main>
        </div>
    </div></ThemeProvider>;
}
