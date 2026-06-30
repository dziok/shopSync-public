import { useMemo } from "react";
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Autocomplete, TextField } from "@mui/material";

export type ResponsibleProducer = {
    id: string;
    name: string;
    producerData?: Record<string, unknown>;
};

export type ResponsibleResponse = {
    responsibleProducers: ResponsibleProducer[];
    count: number;
    totalCount: number;
};


export function ResponsibleProducerSelect({
    data, value, onChange, label = "Producent odpowiedzialny"
}: {
    data?: ResponsibleResponse;
    value?: string;               // id
    onChange: (id: string) => void;
    label?: string;
}) {
    const items = useMemo(
        () => (data?.responsibleProducers ?? []).slice()
            .sort((a, b) => a.name.localeCompare(b.name, "pl", { sensitivity: "base" })),
        [data]
    );
    const current = items.find(p => p.id === value) ?? null;

    return (
        <Autocomplete
            options={items}
            getOptionLabel={(o) => o.name}
            value={current}
            onChange={(_, v) => onChange(v?.id ?? "")}
            renderInput={(params) => <TextField {...params} label={label} />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
        />
    );
}