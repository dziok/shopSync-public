import React, { useMemo } from "react";
import {
    Box,
    Checkbox,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
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

// --- KOLEJNOŚĆ, KTÓRĄ CHCESZ (uproszczona / bez polskich znaków) ---
const CUSTOM_ORDER_KEYS = [
    "stan",
    "eangtin",
    "kodproducenta",
    "marka",
    "model",
    "modelprocesora",
    "ukladklawiatury",
    "przekatnaekranu",
    "seriaprocesora",
    "wielkoscpamieciram",
    "pojemnoscdysku",
    "systemoperacyjny",
    "stanopakowania",
    "rozdzielczoscpx",
    "liczbardzeniprocesora",
    "typdyskutwardego",
    "rodzajkartygraficznej",
    "typ",
    "powlokamatrycy",
    "typmatrycy",
    "odswiezaniematrycy",
    "ekrandotykowy",
    "taktowaniebazoweprocesora",
    "taktowaniemaksymalneprocesora",
    "pamiecpodrecznaprocesora",
    "maksymalnawielkoscpamieciram",
    "typpamieciram",
    "interfejsdysku",
    "pamieckartygraficznej",
    "technologiaakumulatora",
    "typnapedu",
    "czestotliwosctaktowaniapamiecimhz",
    "liczbaslotowram",

    "chipsetkartygraficznej",


    "pojemnoscakumulatoramhz",
    "maksymalnyczaspracybaterii",

    "zlacza",
    "komunikacja",
    "multimedia",
    "sterowanie",
    "cechydodatkowe",
    "kolor",
    "material",
    "szerokoscproduktu",
    "wysokoscproduktu",
    "glebokoscproduktu",
    "wagaproduktu",
    "zawierabaterie",
];

// normalizacja nazw (usuwam polskie znaki, spacje, znaki specjalne)
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/ł/g, "l")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // diakrytyki
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");

}

const getMaxLengthForParam = (name: string) => {
    const normalized = normalizeName(name);
    if (normalized === "kodproducenta") return 45;
    if (normalized === "model") return 50;
    return null;
};

type ParamWithIndex = Param & { __index: number };

const getLabel = (param: Param) =>
    param.required ? param.name : `${param.name} (opcjonalnie)`;

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
    const isProcessorModel = normalizeName(param.name) === "modelprocesora";
    const label = getLabel(param);

    return (
        <Box key={param.id} sx={{ opacity: disabled ? 0.7 : 1, mb: 1.5, width: "100%" }}>
            {param.type === "dictionary" && param.dictionary && isProcessorModel && (
                <Autocomplete
                    options={param.dictionary.map((d) => d.value)}
                    fullWidth
                    value={
                        typeof formData[param.name] === "string"
                            ? formData[param.name]
                            : ""
                    }
                    onChange={(e, newValue) => {
                        if (typeof newValue === "string") {
                            handleChangeAllegro(param.name, newValue);
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={label}
                            required={param.required}
                            disabled={disabled}
                        />
                    )}
                    disabled={disabled}
                />
            )}

            {param.type === "dictionary" && param.dictionary && !isProcessorModel && (
                <FormControl fullWidth required={param.required} disabled={disabled}>
                    <InputLabel>{label}</InputLabel>
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
                    fullWidth
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
                            label={label}
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
                    label={label}
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
                    label={label}
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
    // dołączamy oryginalny index, żeby register(...) działał jak wcześniej
    const paramsWithIndex: ParamWithIndex[] = useMemo(
        () => Parameters.map((p, i) => ({ ...p, __index: i })),
        [Parameters]
    );

    // mapowanie kluczy kolejności -> index
    const orderMap = useMemo(() => {
        const map: Record<string, number> = {};
        CUSTOM_ORDER_KEYS.forEach((key, idx) => {
            map[key] = idx;
        });
        return map;
    }, []);

    // sortowanie wg CUSTOM_ORDER_KEYS, reszta po oryginalnym __index
    const sortedParams = useMemo(() => {
        return [...paramsWithIndex].sort((a, b) => {
            const na = normalizeName(a.name);
            const nb = normalizeName(b.name);

            const ia = orderMap[na];
            const ib = orderMap[nb];

            const aIn = ia !== undefined;
            const bIn = ib !== undefined;

            if (aIn && bIn) return ia - ib;
            if (aIn) return -1;
            if (bIn) return 1;

            // jeśli żaden nie jest w CUSTOM_ORDER – zachowaj kolejność z Allegro
            return a.__index - b.__index;
        });
    }, [paramsWithIndex, orderMap]);

    return (
        <Box sx={{ mb: 3, width: "100%" }}>
            {sortedParams.map((param) => (
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
    );
};

export default AllegroParameters;
