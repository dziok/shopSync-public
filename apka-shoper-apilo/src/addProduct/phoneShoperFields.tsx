import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { Controller, type Control, type FieldValues, type Path, type PathValue } from "react-hook-form";
import { Box, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, Tooltip, Typography } from "@mui/material";
import type { Attribute } from "../types";
import { additionalPhoneAttributes, findPhoneAttribute, getPhoneCategoryGroupIds, isPhoneEnabled, type PhoneAttributeField } from "./phoneShoperAttributes";

type ShoperAttributeGroup = {
    attribute_group_id: number;
    name?: string;
    translations?: { pl_PL?: { name?: string } };
};

export function PhoneTemplateField({ children }: { children: ReactNode }) {
    return <Box sx={{ display: "grid", gap: 0.5, borderLeft: "3px solid", borderColor: "warning.main", pl: 1.25 }}>
        <Tooltip title="Pole zdefiniowane w szablonie, a nie pobierane z atrybutów Shoper." placement="top-start">
            <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 600, lineHeight: 1.2, width: "fit-content", cursor: "help" }}>
                POLE SZABLONU
            </Typography>
        </Tooltip>
        {children}
    </Box>;
}

export function usePhoneCategoryGroups(apiUrl: string, authToken: string, categoryId: number, categorySummary: unknown) {
    const [details, setDetails] = useState<{ categoryId: number; groups: number[]; error: string } | null>(null);
    useEffect(() => {
        if (!categoryId) return;
        let cancelled = false;
        axios.get(`${apiUrl}/categories/shoper/${categoryId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        }).then(response => {
            if (!cancelled) setDetails({ categoryId, groups: getPhoneCategoryGroupIds(response.data), error: "" });
        }).catch(error => {
            if (!cancelled) setDetails({ categoryId, groups: [], error: axios.isAxiosError(error) ? error.message : "Nie udało się pobrać szczegółów kategorii." });
        });
        return () => { cancelled = true; };
    }, [apiUrl, authToken, categoryId]);
    const summaryGroups = getPhoneCategoryGroupIds(categorySummary);
    const current = details?.categoryId === categoryId ? details : null;
    return {
        groupIds: current?.groups.length ? current.groups : summaryGroups,
        loading: Boolean(categoryId) && !current,
        error: current?.error ?? "",
    };
}

export function usePhoneAvailableGroups(apiUrl: string, authToken: string, enabled: boolean) {
    const [result, setResult] = useState<{ groups: ShoperAttributeGroup[]; error: string }>({ groups: [], error: "" });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setLoading(true);
        const load = async () => {
            try {
                const groups: ShoperAttributeGroup[] = [];
                let page = 1;
                let pages = 1;
                while (page <= pages) {
                    const response = await axios.get<{ list?: ShoperAttributeGroup[]; pages?: number }>(`${apiUrl}/attribute-groups`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                        params: { limit: 50, page },
                    });
                    groups.push(...(response.data.list ?? []));
                    pages = Number(response.data.pages) || 1;
                    page++;
                }
                if (!cancelled) setResult({ groups, error: "" });
            } catch (error) {
                if (!cancelled) setResult({ groups: [], error: axios.isAxiosError(error) ? error.message : "Nie udało się pobrać grup atrybutów." });
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [apiUrl, authToken, enabled]);
    return { ...result, loading };
}

export function PhoneGroupPicker({ groups, value, onChange, error, loading }: {
    groups: ShoperAttributeGroup[];
    value: string;
    onChange: (value: string) => void;
    error: string;
    loading: boolean;
}) {
    return <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" color="warning.main">
            Wybierz dodatkową grupę atrybutów Shoper dla tej kategorii.
        </Typography>
        <FormControl fullWidth>
            <InputLabel>Grupa atrybutów Shoper</InputLabel>
            <Select label="Grupa atrybutów Shoper" value={value} onChange={event => onChange(event.target.value)}>
                <MenuItem value=""><em>Wybierz grupę</em></MenuItem>
                {groups.map(group => <MenuItem key={group.attribute_group_id} value={String(group.attribute_group_id)}>
                    {group.translations?.pl_PL?.name || group.name || `Grupa ${group.attribute_group_id}`}
                </MenuItem>)}
            </Select>
        </FormControl>
        {loading ? <Typography variant="body2" color="text.secondary">Pobieranie grup atrybutów...</Typography> : null}
        {!loading && !error && !groups.length ? <Typography variant="body2" color="error">Shoper nie zwrócił żadnej grupy atrybutów.</Typography> : null}
        {error ? <Typography variant="body2" color="error">{error}</Typography> : null}
    </Box>;
}

async function fetchPhoneAttributes(apiUrl: string, authToken: string, groupIds: (string | number)[]): Promise<Attribute[]> {
    const ids = [...new Set(groupIds.map(Number).filter(id => Number.isInteger(id) && id > 0))];
    if (!ids.length) throw new Error("Wybrana kategoria nie ma przypisanej grupy atrybutów Shoper.");
    const lists = await Promise.all(ids.map(async id => {
        const attributes: Attribute[] = [];
        let offset = 0;
        while (true) {
            const response = await axios.get<{ list?: Attribute[]; count?: number | string }>(`${apiUrl}/attributes`, {
                headers: { Authorization: `Bearer ${authToken}` },
                params: { limit: 50, offset, filters: JSON.stringify({ attribute_group_id: id }) },
            });
            const page = response.data.list ?? [];
            attributes.push(...page);
            offset += page.length;
            const count = Number(response.data.count);
            if (page.length < 50 || (Number.isFinite(count) && count > 0 && offset >= count)) break;
        }
        return attributes;
    }));
    return [...new Map(lists.flat().map(attribute => [Number(attribute.attribute_id), attribute])).values()];
}

export function usePhoneShoperAttributes(apiUrl: string, authToken: string, groupIds: (string | number)[]) {
    const [loaded, setLoaded] = useState<{ key: string; attributes: Attribute[]; error: string } | null>(null);
    const [fetchingKey, setFetchingKey] = useState("");
    const groupKey = groupIds.join(",");
    const requestKey = `${authToken}:${groupKey}`;

    useEffect(() => {
        if (!groupKey) return;
        let cancelled = false;
        setFetchingKey(requestKey);
        fetchPhoneAttributes(apiUrl, authToken, groupKey.split(","))
            .then(result => { if (!cancelled) setLoaded({ key: requestKey, attributes: result, error: "" }); })
            .catch(cause => { if (!cancelled) setLoaded({ key: requestKey, attributes: [], error: cause instanceof Error ? cause.message : "Nie udało się pobrać atrybutów Shoper." }); })
            .finally(() => { if (!cancelled) setFetchingKey(""); });
        return () => { cancelled = true; };
    }, [apiUrl, authToken, groupKey, requestKey]);
    return {
        attributes: loaded?.key === requestKey ? loaded.attributes : [],
        loading: Boolean(groupKey) && (loaded?.key !== requestKey || fetchingKey === requestKey),
        error: loaded?.key === requestKey ? loaded.error : "",
    };
}

export function PhoneShoperSelect<T extends FieldValues>({ control, attributes, field, label, checkbox = false, inputType = "text", onBlurValue }: {
    control: Control<T>;
    attributes: Attribute[];
    field: PhoneAttributeField;
    label: string;
    checkbox?: boolean;
    inputType?: string;
    onBlurValue?: (value: string) => void;
}) {
    const attribute = findPhoneAttribute(attributes, field);
    const fieldLabel = attribute?.name || label;
    const input = <Controller
        name={field as Path<T>}
        control={control}
        defaultValue={(checkbox || String(attribute?.type) === "1" ? false : undefined) as PathValue<T, Path<T>>}
        render={({ field: input }) => attribute && String(attribute.type) === "2" ? (
            <FormControl fullWidth>
                <InputLabel>{fieldLabel}</InputLabel>
                <Select name={input.name} label={fieldLabel} value={input.value ?? ""} onChange={event => input.onChange(event.target.value)}
                    onBlur={() => { input.onBlur(); onBlurValue?.(String(input.value ?? "")); }}>
                    <MenuItem value=""><em>Brak</em></MenuItem>
                    {(attribute.options ?? []).map(option => <MenuItem key={option.option_id} value={option.value}>{option.value}</MenuItem>)}
                </Select>
            </FormControl>
        ) : (checkbox || String(attribute?.type) === "1") ? (
            <FormControlLabel control={<Checkbox name={input.name} checked={isPhoneEnabled(input.value)} onChange={event => input.onChange(event.target.checked)} onBlur={input.onBlur} />} label={fieldLabel} />
        ) : <TextField name={input.name} fullWidth label={fieldLabel} type={inputType} value={input.value ?? ""}
            onChange={input.onChange} onBlur={() => { input.onBlur(); onBlurValue?.(String(input.value ?? "")); }} />}
    />;
    return attribute ? input : <PhoneTemplateField>{input}</PhoneTemplateField>;
}

export function PhoneAdditionalShoperFields<T extends FieldValues>({ control, attributes }: {
    control: Control<T>;
    attributes: Attribute[];
}) {
    const additional = additionalPhoneAttributes(attributes);
    if (!additional.length) return null;
    return <>
            {additional.map(attribute => <Controller
                key={attribute.attribute_id}
                name={`attribute_${attribute.attribute_id}` as Path<T>}
                control={control}
                render={({ field }) => String(attribute.type) === "2" ? <FormControl fullWidth>
                    <InputLabel>{attribute.name}</InputLabel>
                    <Select name={field.name} label={attribute.name} value={field.value ?? ""} onChange={event => field.onChange(event.target.value)}>
                        <MenuItem value=""><em>Brak</em></MenuItem>
                        {(attribute.options ?? []).map(option => <MenuItem key={option.option_id} value={option.value}>{option.value}</MenuItem>)}
                    </Select>
                </FormControl> : String(attribute.type) === "1" ?
                    <FormControlLabel control={<Checkbox name={field.name} checked={Boolean(field.value)} onChange={event => field.onChange(event.target.checked)} />} label={attribute.name} /> :
                    <TextField name={field.name} fullWidth label={attribute.name} value={field.value ?? ""} onChange={field.onChange} />}
            />)}
    </>;
}
