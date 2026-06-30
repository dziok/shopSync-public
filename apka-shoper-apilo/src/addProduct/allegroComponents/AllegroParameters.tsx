import React, { useMemo } from "react";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
    Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

interface Param {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    dictionary?: { id: string; value: string }[];
    restrictions?: {
        multipleChoices?: boolean;
    };
}

interface Props {
    Parameters: Param[];
    formData: Record<string, any>;
    register: any;
    handleChangeAllegro: (paramName: string, value: any) => void;
    isParamDisabled: (paramName: string) => boolean;
}

const ORDER = [
    "Ogólne",
    "Wymiary i waga",
    "Procesor",
    "Pamięć RAM",
    "Płyta główna",
    "Karta graficzna",
    "Dyski",
    "Napęd",
    "Zasilacz",
    "Komunikacja",
    "Porty i złącza",
    "Monitor / Wyświetlacz",
    "Obudowa",
    "Bezpieczeństwo",
    "Opakowanie",
    "Inne",
] as const;

type Category = (typeof ORDER)[number];

const RULES: Array<{ cat: Category; rx: RegExp[] }> = [
    {
        cat: "Procesor", rx: [
            /gniazda/i, /seria/i, /procesor/i, /rdzeni/i, /wątk/i, /taktowan/i, /bazow/i, /maksymaln/i,
            /cache|pamięć\s+podręczn/i, /socket|gniazda\s+procesora/i, /seria\s+procesor/i, /generacj/i, /\bTDP\b/i
        ]
    },
    {
        cat: "Pamięć RAM", rx: [
            /\bRAM\b/i, /pamięci?\s+RAM/i, /\bDDR/i, /taktowanie\s+szyny/i,
            /kanałow/i, /slotów?\s+RAM/i, /pojemnoś.*RAM/i, /architektura wielokanałowa pamięci RAM/i
        ]
    },
    {
        cat: "Dyski", rx: [
            /dysk/i, /\bSSD\b/i, /\bHDD\b/i, /\bM\.?2\b/i, /\bNVMe\b/i,
            /\bSATA\b/i, /Interfejs\s+dysku/i, /Prędkość\s+obrotowa/i, /Łączenie\s+dysków|RAID/i
        ]
    },
    {
        cat: "Karta graficzna", rx: [
            /graficznej/i, /karta\s+graficzn/i, /\bGPU\b/i, /chipset\s+karty/i, /pamięć\s+karty/i, /złącza\s+karty/i, /chłodzenie\s+karty/i
        ]
    },
    {
        cat: "Płyta główna", rx: [
            /płyty?\s+główn/i, /chipset\s+płyty/i, /gniazda\s+rozszerzeń/i, /złącza\s+zewnętrzne\s+płyty/i, /producent\s+płyty/i, /model\s+płyty/i
        ]
    },

    { cat: "Obudowa", rx: [/typ\s+obudow/i, /obudow/i, /porty/i, /\bUSB\b/i, /HDMI/i, /Display\s*Port|^DP\b/i, /\bVGA\b/i, /RJ-?45/i, /audio|jack/i, /złącza\s+obudowy/i], },
    { cat: "Monitor / Wyświetlacz", rx: [/monitor/i, /efektywności\s+energetycznej\s+monitora/i, /przekątn/i, /rozdzielczość/i] },
    { cat: "Wymiary i waga", rx: [/Wysokość/i, /Szerokość/i, /Głębokość/i, /Waga\b/i, /Waga\s+z\s+opakowaniem/i] },

    {
        cat: "Ogólne", rx: [
            /zasilacz/i, /napęd/i, /komunikacj/i, /^Stan$/i, /Marka/i, /^Model$/i, /Kod\s+produktu/i, /\bEAN\b/i, /Kolor/i,
            /Typ\s+komputera/i, /System\s+operacyjny/i, /Dołączone\s+oprogramowanie/i, /Załączone\s+wyposażenie/i
        ]
    },
];

function categorize(name: string): Category {
    for (const { cat, rx } of RULES) {
        if (rx.some(r => r.test(name))) return cat;
    }
    return "Inne";
}

const normalizeFieldName = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");

const getMaxLengthForParam = (name: string) => {
    const normalized = normalizeFieldName(name);
    if (normalized === "kodproducenta") return 45;
    if (normalized === "model") return 50;
    return null;
};

type ParamWithIndex = Param & { __index: number };

function ParamField({
    param,
    formData,
    register,
    handleChangeAllegro,
    isParamDisabled,
}: {
    param: ParamWithIndex;
    formData: Record<string, any>;
    register: any;
    handleChangeAllegro: (paramName: string, value: any) => void;
    isParamDisabled: (paramName: string) => boolean;
}) {
    const isMulti = param.restrictions?.multipleChoices === true;
    const disabled = isParamDisabled(param.name);
    const maxLength = getMaxLengthForParam(param.name);

    return (
        <Box key={param.id} sx={{ opacity: disabled ? 0.7 : 1, mb: 1.5, width: '25vw' }}>
            {param.type === "dictionary" && param.dictionary && (
                <FormControl fullWidth required={param.required} disabled={disabled} sx={{ width: 'inherit' }}>
                    <InputLabel>{param.name}</InputLabel>
                    <Select
                        {...register(`attribute_${param.__index}`)}
                        multiple={isMulti}
                        value={
                            isMulti
                                ? Array.isArray(formData[param.name])
                                    ? formData[param.name]
                                    : []
                                : typeof formData[param.name] === "string"
                                    ? formData[param.name]
                                    : ""
                        }
                        label={param.name}
                        onChange={(e: SelectChangeEvent<any>) =>
                            handleChangeAllegro(param.name, e.target.value)
                        }
                        renderValue={(selected) =>
                            Array.isArray(selected) ? selected.join(", ") : selected
                        }
                    >
                        {param.dictionary.map((option) => (
                            <MenuItem key={option.id} value={option.value}>
                                {isMulti && (
                                    <Checkbox
                                        checked={
                                            Array.isArray(formData[param.name]) &&
                                            formData[param.name].includes(option.value)
                                        }
                                        disabled={disabled}
                                    />
                                )}
                                <ListItemText primary={option.value} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
            {param.type === "dictionary_ac" && Array.isArray(param.dictionary) && (
                <Autocomplete
                    multiple={isMulti}
                    options={param.dictionary.map((d) => d.value)}
                    value={
                        isMulti
                            ? Array.isArray(formData[param.name])
                                ? formData[param.name]
                                : []
                            : typeof formData[param.name] === "string"
                                ? [formData[param.name]]
                                : []
                    }
                    onChange={(e, newValue) => {
                        if (!newValue) return;
                        const cleanValues = (Array.isArray(newValue) ? newValue : [newValue]).filter(
                            (v): v is string => typeof v === "string"
                        );
                        const valueToSet = isMulti ? cleanValues : cleanValues[0] || "";
                        handleChangeAllegro(param.name, valueToSet);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={param.name}
                            required={param.required}
                            disabled={disabled}
                        />
                    )}
                    disabled={disabled}
                />
            )}

            {(param.type === "integer" || param.type === "float") && (
                <TextField
                    type="number"
                    label={param.name}
                    fullWidth
                    required={param.required}
                    inputProps={{ step: param.type === "float" ? "0.01" : "1" }}
                    value={
                        formData[param.name] !== undefined && formData[param.name] !== null
                            ? String(formData[param.name])
                            : ""
                    }
                    onChange={(e) => handleChangeAllegro(param.name, e.target.value)}
                    disabled={disabled}
                />
            )}

            {param.type === "string" && (
                <TextField
                    type="text"
                    label={param.name}
                    fullWidth
                    required={param.required}
                    value={formData[param.name] || ""}
                    inputProps={maxLength ? { maxLength } : undefined}
                    onChange={(e) => {
                        const nextValue = maxLength
                            ? String(e.target.value).slice(0, maxLength)
                            : e.target.value;
                        handleChangeAllegro(param.name, nextValue);
                    }}
                    disabled={disabled}
                />
            )}

        </Box>

    );
}

const AllegroParameters: React.FC<Props> = ({
    Parameters,
    formData,
    register,
    handleChangeAllegro,
    isParamDisabled,
}) => {
    // dołącz oryginalny index, żeby register(...) działał jak wcześniej
    const paramsWithIndex: ParamWithIndex[] = useMemo(
        () => Parameters.map((p, i) => ({ ...p, __index: i })),
        [Parameters]
    );

    // sortuj po nazwie (PL) i pogrupuj wg kategorii
    const grouped = useMemo(() => {
        const sorted = [...paramsWithIndex].sort((a, b) =>
            a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
        );
        const acc: Record<Category | string, ParamWithIndex[]> = {};
        for (const p of sorted) {
            const cat = categorize(p.name);
            (acc[cat] ??= []).push(p);
        }
        return acc;
    }, [paramsWithIndex]);

    // lista kategorii w kolejności + ewentualne „inne” spoza ORDER
    const allCategories: string[] = useMemo(() => {
        const known = ORDER.filter((c) => grouped[c]?.length);
        const extras = Object.keys(grouped).filter((c) => !known.includes(c as Category));
        return [...known, ...extras];
    }, [grouped]);

    return (
        <>
            <Button type="reset">reset</Button>
            {allCategories.map((cat) => (
                <Box className='test' key={cat} sx={{ mb: 3, width: '25vw' }}>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mt: 1, mb: 1, opacity: 0.9, textAlign: 'center' }}
                    >
                        {cat}
                    </Typography>

                    {grouped[cat]?.map((param) => (
                        <ParamField
                            key={param.id}
                            param={param}
                            formData={formData}
                            register={register}
                            handleChangeAllegro={handleChangeAllegro}
                            isParamDisabled={isParamDisabled}
                        />
                    ))}
                </Box>
            ))}

        </>
    );
};

export default AllegroParameters;
