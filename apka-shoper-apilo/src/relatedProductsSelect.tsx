import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from "@mui/material";
import { API_URL } from "./config";

export type RelatedProductPack = {
    id: string;
    name: string;
    productIds: number[];
    revision: number;
};

type RelatedProductsSelectProps = {
    authToken: string;
    value: string;
    onChange: (value: string) => void;
    label?: string;
};

const selectSx = {
    "& .MuiInputBase-root": {
        backgroundColor: "#ffffff",
        color: "#111827",
    },
    "& .MuiInputLabel-root": {
        color: "#374151",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#1976d2",
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#cbd5e1",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#94a3b8",
    },
    "& .MuiSelect-select": {
        color: "#111827",
        backgroundColor: "#ffffff",
    },
    "& .MuiSvgIcon-root": {
        color: "#111827",
    },
};

const menuProps = {
    PaperProps: {
        sx: {
            backgroundColor: "#ffffff",
            color: "#111827",
            "& .MuiMenuItem-root": {
                color: "#111827",
            },
            "& .MuiMenuItem-root.Mui-selected": {
                backgroundColor: "#e0f2fe",
            },
            "& .MuiMenuItem-root.Mui-selected:hover": {
                backgroundColor: "#bae6fd",
            },
        },
    },
};

function RelatedProductsSelect({
    authToken,
    value,
    onChange,
    label = "Produkty powiązane",
}: RelatedProductsSelectProps) {
    const [packs, setPacks] = useState<RelatedProductPack[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPacks = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/related-products`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                setPacks(Array.isArray(response.data?.packs) ? response.data.packs : []);
            } catch (error) {
                console.error("Błąd pobierania paczek produktów powiązanych:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPacks();
    }, [authToken]);

    return (
        <FormControl fullWidth margin="normal" sx={selectSx}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value}
                label={label}
                onChange={(event: SelectChangeEvent) => onChange(event.target.value)}
                disabled={loading}
                MenuProps={menuProps}
            >
                <MenuItem value="">Bez paczki</MenuItem>
                {packs.map((pack) => (
                    <MenuItem key={pack.id} value={pack.id}>
                        {pack.name} ({pack.productIds.length})
                    </MenuItem>
                ))}
            </Select>
            {packs.length === 0 && !loading && (
                <Typography variant="caption" sx={{ color: "#6b7280", mt: 0.5 }}>
                    Brak zapisanych paczek. Dodaj je w zakładce "produkty powiązane".
                </Typography>
            )}
        </FormControl>
    );
}

export default RelatedProductsSelect;
